import ts from "typescript"
import { flatMap } from "../utils"
import { extractPropTypes } from "../extractPropTypes"
import { ComponentFinder, ComponentFinderResult, ResultType } from "./types"
import { isExported, findReactPropType } from "./utils"

/**
 * A ComponentFinder for function components
 */
export const variableStatementFinder: ComponentFinder = {
    extract(node: ts.Statement, program: ts.Program): ComponentFinderResult[] {
        if (!ts.isVariableStatement(node)) return []
        if (!isExported(node)) return []
        if (!node.declarationList.declarations) return []

        const checker = program.getTypeChecker()

        const names = node.declarationList.declarations.map(declaration => declaration.name)

        return flatMap(names, declarationName => {
            if (!ts.isIdentifier(declarationName)) return []

            const type = checker.getTypeAtLocation(declarationName)
            const propType = findReactPropType(type, checker)

            if (!propType) {
                return []
            }

            return [
                {
                    type: ResultType.ComponentInfo,
                    componentInfo: {
                        name: declarationName.text,
                        propTypes: extractPropTypes(propType, checker),
                    },
                },
            ]
        })
    },
}
