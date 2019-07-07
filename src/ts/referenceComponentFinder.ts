import ts from "typescript"
import { ComponentFinder } from "./types"
import { toTypeInfo, isReactFunctionComponent, getReactPropsType } from "./utils"

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
                name: expression.text,
                propsTypeInfo: toTypeInfo(getReactPropsType(type), checker),
            },
        ]
    },
}
