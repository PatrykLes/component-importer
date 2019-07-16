import ts from "typescript"
import { flatMap } from "../utils"
import { extractPropTypes } from "./extractPropTypes"
import { ComponentFinder, ComponentFinderResult, ResultType } from "./types"
import { getReactPropsType, isReactFunctionComponent } from "./utils"

export const exportTypeFinder: ComponentFinder = {
    extract(node: ts.Statement, program: ts.Program): ComponentFinderResult[] {
        if (!ts.isExportDeclaration(node)) return []

        const identifiers = findExportedIdentifiers(node)

        const checker = program.getTypeChecker()

        // const sourceFile = node.getSourceFile()
        // const mod = checker.getSymbolAtLocation(sourceFile)
        // mod.exports.forEach((exp, key) => {
        //     if ((exp.flags & ts.SymbolFlags.ExportStar) == ts.SymbolFlags.ExportStar) {
        //     }

        //     const comp = exp
        //     const type = checker.getDeclaredTypeOfSymbol(comp)
        //     console.log(type)
        // })

        return flatMap(identifiers, identifier => {
            const type = checker.getTypeAtLocation(identifier)

            if (!isReactFunctionComponent(type)) return []

            return [
                {
                    type: ResultType.ComponentInfo,
                    componentInfo: {
                        name: identifier.text,
                        propTypes: extractPropTypes(getReactPropsType(type), checker),
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

/*
var mod = checker.getSymbolAtLocation(sourceFile)
var comp = mod.exports.get("SimpleReactComponent2")
var type = checker.getDeclaredTypeOfSymbol(comp)


checker.getSymbolAtLocation(exportDecl.moduleSpecifier)
(exp.flags & ts.SymbolFlags.ExportStar) == ts.SymbolFlags.ExportStar





export * from "./path"

// type checker resolves * to a TypeFlags.ValueModule
checker.getSymbolAtLocation(exportDecl.moduleSpecifier)
* ->  { MyComp: MyComp, MyComp2: MyComp2}



const type: ts.Type = null

const xx = type.getBaseTypes()[0]
xx.flags & ts.TypeFlags.Object
const objType = xx as ts.ObjectType
objType.objectFlags && ObjectFlags.Reference
const refType = objType as ts.TypeReference
refType.typeArguments



*/
