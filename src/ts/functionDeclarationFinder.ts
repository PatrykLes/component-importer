import ts from "typescript"
import { extractPropTypes } from "./extractPropTypes"
import { ComponentFinder, ResultType } from "./types"
import { isExported, getFunctionComponentParameter } from "./utils"

export const functionDeclarationFinder: ComponentFinder = {
    extract(node: ts.Statement, program: ts.Program) {
        if (!ts.isFunctionDeclaration(node) || !isExported(node)) {
            return []
        }

        if (!node.name) {
            return []
        }
        const name = node.name.text

        const checker = program.getTypeChecker()
        const type = checker.getTypeAtLocation(node)

        const paramDeclaration = getFunctionComponentParameter(type)

        if (!paramDeclaration) {
            return []
        }

        const propType = checker.getTypeAtLocation(paramDeclaration)

        return [
            {
                type: ResultType.ComponentInfo,
                componentInfo: {
                    name,
                    propTypes: extractPropTypes(propType, checker),
                },
            },
        ]
    },
}
