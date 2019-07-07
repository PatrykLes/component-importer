import ts from "typescript"
import { ComponentFinder } from "./types"
import { getFirstGenericArgument, toTypeInfo, isExported } from "./utils"

/**
 * A ComponentFinder for function components
 */
export const functionComponentFinder: ComponentFinder = {
    extract(node: ts.Statement, program: ts.Program) {
        if (!ts.isVariableStatement(node)) return []
        if (!isExported(node)) return []

        const decl = node.declarationList.declarations[0]
        if (!decl) return []

        const name = (decl.name as ts.Identifier).text
        const typeNode = decl.type
        if (!typeNode) return []

        const checker = program.getTypeChecker()

        const type = checker.getTypeFromTypeNode(getFirstGenericArgument(decl.type))
        return [
            {
                name,
                propsTypeInfo: toTypeInfo(type, checker),
            },
        ]
    },
}
