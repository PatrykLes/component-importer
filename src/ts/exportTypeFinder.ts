import ts from "typescript"
import { ComponentFinder } from "./types"
import { isReactFunctionComponent, toTypeInfo, getReactPropsType } from "./utils"
import { ComponentInfo } from "../types"
import { printDebugInfo, flatMap } from "../utils"

export const exportTypeFinder: ComponentFinder = {
    extract(node: ts.Statement, program: ts.Program): ComponentInfo[] {
        if (!ts.isExportDeclaration(node)) return []

        const checker = program.getTypeChecker()

        return findIdentifiers(node)
            .map(identifier => {
                const type = checker.getTypeAtLocation(identifier)

                if (!isReactFunctionComponent(type)) {
                    return
                }
                return {
                    name: identifier.text,
                    propsTypeInfo: toTypeInfo(getReactPropsType(type), checker),
                }
            })
            .filter(x => x)
    },
}

function findIdentifiers(node: ts.ExportDeclaration): ts.Identifier[] {
    if (!node.exportClause) {
        return []
    }
    return flatMap(node.exportClause.elements, element => element.getChildren()).filter(
        x => ts.isIdentifier(x) && x.text !== "default",
    ) as ts.Identifier[]
}
