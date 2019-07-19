import ts from "typescript"
import { flatMap } from "../utils"
import { extractPropTypes } from "./extractPropTypes"
import { ComponentFinder, ComponentFinderResult, ResultType } from "./types"
import { findReactPropType } from "./utils"

export const aliasedSymbolFinder: ComponentFinder = {
    extract(node: ts.Statement, program: ts.Program): ComponentFinderResult[] {
        if (!ts.isExportDeclaration(node)) return []

        const checker = program.getTypeChecker()

        if (!node.exportClause) {
            return []
        }

        return flatMap(node.exportClause.elements, el => {
            if (!el.propertyName) {
                return []
            }

            const symbol = checker.getSymbolAtLocation(el.propertyName)

            if (!symbol) {
                return []
            }

            const type = checker.getDeclaredTypeOfSymbol(symbol)
            const propType = findReactPropType(type, checker)

            if (!propType) {
                return []
            }

            return [
                {
                    type: ResultType.ComponentInfo,
                    componentInfo: {
                        name: el.name.text,
                        propTypes: extractPropTypes(propType, checker),
                    },
                },
            ]
        })
    },
}
