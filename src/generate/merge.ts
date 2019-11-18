import ts from "typescript"
import { ComponentEmitInfo, EmitResult, Formatter } from "../types"
import { differenceBy, printNode } from "../utils"
import { createPropertyControlPropertyAssignments } from "./conversion"

type PropertyAssignments = ts.ObjectLiteralExpression & {
    properties: ts.NodeArray<ts.PropertyAssignment & { name: ts.Identifier }>
}

type AddPropertyControlsStatement = ts.ExpressionStatement & {
    expression: ts.CallExpression & { arguments: [any, PropertyAssignments] }
}

function isAddPropertyControlsStatement(node: ts.Statement): node is AddPropertyControlsStatement {
    if (!ts.isExpressionStatement(node)) {
        return false
    }

    const expression = node.expression

    // A call expression is essentially a function invokation
    if (!ts.isCallExpression(expression) || !expression.expression) {
        return false
    }

    const identifier = expression.expression

    if (!ts.isIdentifier(identifier)) {
        return false
    }

    if (identifier.text !== "addPropertyControls") {
        return false
    }

    // addPropertyControls(Component, propertyControls) has two arguments
    if (expression.arguments.length !== 2) {
        return false
    }

    const object = expression.arguments[1]

    if (!ts.isObjectLiteralExpression(object)) {
        return false
    }

    return true
}

export function findAddPropertyControlsStatement(file: ts.SourceFile): undefined | AddPropertyControlsStatement {
    for (const statement of file.statements) {
        if (isAddPropertyControlsStatement(statement)) {
            return statement
        }
    }
    return undefined
}

/**
 * Given a SourceFile
 */
export function updatePropertyControls(
    // Pick only the used subset to facilitate testing.
    formatter: Formatter,
    sourceFile: ts.SourceFile,
    comp: Pick<ComponentEmitInfo, "propTypes">,
): string {
    const addPropertyControlsStatement = findAddPropertyControlsStatement(sourceFile)
    if (!addPropertyControlsStatement) {
        return sourceFile.getText()
    }

    const [
        addPropertyControlsComponentIdentifier,
        addPropertyControlsObject,
    ] = addPropertyControlsStatement.expression.arguments

    const newProps = differenceBy(
        comp.propTypes,
        prop => prop.name,
        Array.from(addPropertyControlsObject.properties),
        prop => (prop.name as ts.Identifier).text,
    )

    const newPropertyAssignments = createPropertyControlPropertyAssignments({ propTypes: newProps })

    const newAddPropertyControlsObject = ts.updateObjectLiteral(
        addPropertyControlsObject,
        addPropertyControlsObject.properties.concat(newPropertyAssignments),
    )

    const newStatement = ts.updateStatement(
        addPropertyControlsStatement,
        ts.updateCall(
            addPropertyControlsStatement.expression,
            addPropertyControlsStatement.expression.expression,
            null,
            [addPropertyControlsComponentIdentifier, newAddPropertyControlsObject],
        ),
    )

    /**
     * Split the sourceFile into 2 chunks:
     * - startChunk: will contain all code until the addPropertyControls statement's argument
     * - endChunk: will contain all code after the addPropertyControls statement's argument
     *
     * Example:
     *
     * ```jsx
     * import * as React from "react"
     *
     * export const Comp = (props) => <p>{props.text}</p>
     *
     * // Start chunk ends here ↴
     * addPropertyControls(Comp, {
     *   foo: { type: ControlType.String }
     *   })
     * // ⬑ End chunk starts here
     * ```
     */

    const text = sourceFile.getText()
    const startIndex = addPropertyControlsStatement.getStart(sourceFile)
    const endIndex = startIndex + addPropertyControlsStatement.getText(sourceFile).length
    const startChunk = text.substr(0, startIndex)
    const endChunk = text.substr(endIndex, text.length)

    const newStatementText = printNode(newStatement, ts.EmitHint.Unspecified)

    return formatter(`${startChunk}${newStatementText}${endChunk}`)
}

type EmitMergeOptions = {
    formatter: Formatter
    framerProjectProgram: ts.Program
    components: ComponentEmitInfo[]
}

export function emitMerge({ formatter, framerProjectProgram, components }: EmitMergeOptions): EmitResult[] {
    return components
        .filter(comp => comp.emit)
        .map(comp => {
            const sourceFile = framerProjectProgram.getSourceFile(comp.emitPath)
            if (!sourceFile) {
                return undefined
            }

            const emitResult: EmitResult = {
                type: "component",
                emitPath: comp.emitPath,
                outputSource: updatePropertyControls(formatter, sourceFile, comp),
            }

            return emitResult
        })
        .filter(x => !!x)
}
