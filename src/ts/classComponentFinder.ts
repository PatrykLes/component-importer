import ts from "typescript"
import { ComponentFinder } from "./types"
import { isExported, getFirstGenericArgument, toTypeInfo } from "./utils"

export const classComponentFinder: ComponentFinder = {
    extract(node: ts.Statement, program: ts.Program) {
        if (!ts.isClassDeclaration(node) || !isExported(node)) {
            return []
        }

        const clause = node.heritageClauses.find(clause => clause.token === ts.SyntaxKind.ExtendsKeyword)
        if (!clause) {
            return []
        }

        const checker = program.getTypeChecker()

        const type = checker.getTypeFromTypeNode(getFirstGenericArgument(clause))

        return [
            {
                name: node.name.text,
                propsTypeInfo: toTypeInfo(type, checker),
            },
        ]
    },
}
