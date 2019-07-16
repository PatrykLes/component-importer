import fs from "fs"
import path from "path"
import ts, { Program, SourceFile, StringLiteral } from "typescript"
import { ComponentFinder, ComponentFinderResult, ResultType } from "./types"
import { isExported, getFunctionComponentParameter } from "./utils"
import { flatMap } from "../utils"
import { extractPropTypes } from "./extractPropTypes"

/**
 * Extracts components with the following shape
 *
 * ```typescript
 * export const Foo = (props: Props) => <foo/>
 *
 * ```
 */
export const exportJsxElementArrowFunctionFinder: ComponentFinder = {
    extract(node: ts.Statement, program: ts.Program): ComponentFinderResult[] {
        if (!isExported(node)) return []
        if (!ts.isVariableStatement(node)) return []
        if (!node.declarationList.declarations) return []

        const checker = program.getTypeChecker()

        return flatMap(node.declarationList.declarations, decl => {
            const { name } = decl
            if (!ts.isIdentifier(name)) {
                return []
            }

            const type = checker.getTypeAtLocation(decl)

            const paramDeclaration = getFunctionComponentParameter(type)

            if (!paramDeclaration) {
                return []
            }

            const propType = checker.getTypeAtLocation(paramDeclaration)

            return [
                {
                    type: ResultType.ComponentInfo,
                    componentInfo: {
                        name: name.text,
                        propTypes: extractPropTypes(propType, checker),
                    },
                },
            ]
        })
    },
}
