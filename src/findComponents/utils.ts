import { strict as assert } from "assert"
import fs from "fs"
import path from "path"
import ts from "typescript"

/**
 * @returns true if the given node contains the `export` modifier.
 */
export function isExported(node: ts.Statement): boolean {
    if (!node.modifiers) {
        return false
    }
    return node.modifiers.some(modifier => modifier.kind === ts.SyntaxKind.ExportKeyword)
}

export function getFirstGenericArgument(type: ts.Node): ts.TypeNode | undefined {
    if (ts.isTypeReferenceNode(type) && type.typeArguments) {
        const genericArgType = type.typeArguments[0]
        return genericArgType
    }
    if (ts.isHeritageClause(type) && type.types && type.types[0] && type.types[0].typeArguments) {
        return type.types[0].typeArguments[0]
    }

    return undefined
}

/**
 * Returns the parameter declaration of a react function component or undefined if not found.
 *
 * Expects type to be a function with the following shape
 *
 * ```ts
 * (arg: SomeType) => JSX.Element
 * ```
 */
export function getFunctionComponentParameter(type: ts.Type): ts.ParameterDeclaration | undefined {
    if (!type.getCallSignatures() || type.getCallSignatures().length === 0) {
        return
    }
    const [callSignature] = type.getCallSignatures()

    // Should match Element (From JSX.Element)
    if (
        !callSignature.getReturnType() ||
        !callSignature.getReturnType().getSymbol() ||
        callSignature
            .getReturnType()
            .getSymbol()!
            .getName() !== "Element"
    ) {
        return
    }

    if (callSignature.getParameters().length !== 1) {
        return
    }

    const [parameter] = callSignature.getParameters()
    const { valueDeclaration } = parameter
    if (!ts.isParameter(valueDeclaration)) {
        return
    }

    if (!valueDeclaration.type) {
        return
    }

    return valueDeclaration
}

export function getFirstTypeArgument(type: ts.Type): ts.Type | undefined {
    // XXX ugly, ugly, ugly but I couldn't find another way of getting the first type argument from the FunctionComponent type.
    const typeArguments = (type as any)["typeArguments"]
    if (typeArguments && typeArguments.length > 0) {
        return typeArguments[0]
    }

    if (type.aliasTypeArguments && type.aliasTypeArguments.length > 0) {
        return type.aliasTypeArguments[0]
    }

    return undefined
}

/**
 * @param pathNode a StringLiteral node containing a an import path. So, for example in `export * from "./path"`, the `pathNode` should be the node that contains `./path`
 */
// XXX this is a super hacky way of finding a source file given an import path.
// It takes into account the fact that an import can result in a tsx, tsx, /index.ts, etc.
// Ideally the ts compiler should have a way to resolve these references, but I wasn't able to find
// how
export function findSourceFiles(program: ts.Program, pathNode: ts.StringLiteral): ts.SourceFile[] {
    const relativeImportPath = pathNode.text
    const { fileName } = pathNode.getSourceFile()
    const resolvedImport = path.join(path.dirname(fileName), relativeImportPath)

    const possibilities = [".ts", ".tsx", ".d.ts", "/index.ts", "/index.tsx", "/index.d.ts"].map(
        extension => `${resolvedImport}${extension}`,
    )

    const sourceFiles = possibilities
        .filter(filePath => fs.existsSync(filePath))
        .map(filePath => {
            const sourceFile = program.getSourceFile(filePath)!

            return sourceFile
        })
        .filter(sourceFile => {
            return !!sourceFile
        })

    if (process.env.NODE_ENV !== "production") {
        assert(
            sourceFiles.length > 0,
            `Failed to resolve import from pathNode ${pathNode.getText()} relative to ${fileName}. Tried the following combinations: \n${possibilities.join(
                "\n",
            )}`,
        )
    }

    return sourceFiles
}

/**
 * @returns true iff `exportDeclaration` matches the `export * from "path"` syntax.
 */
export function isExportStar(exportDeclaration: ts.ExportDeclaration) {
    return !exportDeclaration.exportClause
}

export function findReactPropType(type: ts.Type, checker: ts.TypeChecker): ts.Type | undefined {
    // Case 1: obtain the type parameter from an identifier
    // Type is const foo: React.SFC<Props> = props => {
    //   return <foo/>
    // }
    //
    // In this case the identifier is foo.
    const propType = getFirstTypeArgument(type)
    if (propType) {
        return propType
    }

    // Case 2: obtain the type argument from the actual function type
    // Type is (props: Props) => JSX.Element
    // Get the parameter declaration for `props`.
    const paramDeclaration = getFunctionComponentParameter(type)
    if (paramDeclaration) {
        return checker.getTypeAtLocation(paramDeclaration)
    }

    // Case 3: obtain the type argument from the type hierarchy
    // Type is class Foo extends React.Component<Props>
    if (type.isClass() && type.getBaseTypes()!.length > 0) {
        const typeArg = getFirstTypeArgument(type.getBaseTypes()![0])
        if (typeArg) {
            return typeArg
        }
    }

    return undefined
}
