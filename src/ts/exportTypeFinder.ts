import ts from "typescript"
import { flatMap, printDebugInfo, getSyntaxKinds } from "../utils"
import { ComponentFinder, ComponentFinderResult, ResultType } from "./types"
import { getReactPropsType, isReactFunctionComponent, toTypeInfo } from "./utils"

export const exportTypeFinder: ComponentFinder = {
    extract(node: ts.Statement, program: ts.Program): ComponentFinderResult[] {
        if (!ts.isExportDeclaration(node)) return []

        const identifiers = findExportedIdentifiers(node)

        const checker = program.getTypeChecker()

        return flatMap(identifiers, identifier => {
            const type = checker.getTypeAtLocation(identifier)

            if (!isReactFunctionComponent(type)) return []

            return [
                {
                    type: ResultType.ComponentInfo,
                    componentInfo: {
                        name: identifier.text,
                        propsTypeInfo: toTypeInfo(getReactPropsType(type), checker),
                    },
                },
            ]
        })
    },
}

/**
 * Given an export with the following sintax
 *
 * ```typescript
 * export { A as B, C as D }
 * ```
 *
 * will output the identifiers for `B` and `D`
 */
function findExportedIdentifiers(node: ts.ExportDeclaration): ts.Identifier[] {
    const { exportClause } = node
    if (!exportClause) {
        return []
    }

    return exportClause.elements.map(element => element.name)
}
