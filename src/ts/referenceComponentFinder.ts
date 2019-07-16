import ts from "typescript"
import { extractPropTypes } from "./extractPropTypes"
import { ComponentFinder, ResultType } from "./types"
import { getReactPropsType, isReactFunctionComponent } from "./utils"

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

        if (!isReactFunctionComponent(type)) return []

        return [
            {
                type: ResultType.ComponentInfo,
                componentInfo: {
                    name: expression.text,
                    propTypes: extractPropTypes(getReactPropsType(type), checker),
                },
            },
        ]
    },
}
