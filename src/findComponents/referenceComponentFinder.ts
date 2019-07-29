import ts from "typescript"
import { extractPropTypes } from "../extractPropTypes"
import { ComponentFinder, ResultType } from "./types"
import { findReactPropType } from "./utils"

/**
 * A ComponentFinder for references to a Function Component
 */
export const referenceComponentFinder: ComponentFinder = {
    extract(node: ts.Statement, program: ts.Program) {
        if (!ts.isExportAssignment(node)) return []

        const expression = node.expression
        if (!ts.isIdentifier(expression)) return []

        const checker = program.getTypeChecker()
        const type = checker.getTypeAtLocation(expression)

        const propType = findReactPropType(type, checker)

        if (!propType) {
            return []
        }

        return [
            {
                type: ResultType.ComponentInfo,
                componentInfo: {
                    name: expression.text,
                    propTypes: extractPropTypes(propType, checker),
                },
            },
        ]
    },
}
