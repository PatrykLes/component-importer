import ts from "typescript"
import { extractPropTypes } from "./extractPropTypes"
import { ComponentFinder, ResultType } from "./types"
import { getFirstGenericArgument, isExported } from "./utils"

export const classComponentFinder: ComponentFinder = {
    extract(node: ts.Statement, program: ts.Program) {
        if (!ts.isClassDeclaration(node) || !isExported(node)) {
            return []
        }

        if (!node.heritageClauses) return []

        const clause = node.heritageClauses.find(clause => clause.token === ts.SyntaxKind.ExtendsKeyword)
        if (!clause) {
            return []
        }

        const checker = program.getTypeChecker()

        const type = checker.getTypeFromTypeNode(getFirstGenericArgument(clause))

        return [
            {
                type: ResultType.ComponentInfo,
                componentInfo: {
                    name: node.name.text,
                    propTypes: extractPropTypes(type, checker),
                },
            },
        ]
    },
}
