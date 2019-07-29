import ts from "typescript"
import { extractPropTypes } from "../extractPropTypes"
import { ComponentFinder, ResultType } from "./types"
import { isExported, findReactPropType } from "./utils"

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

        const propType = findReactPropType(type, checker)

        if (!propType) {
            return []
        }

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
