import * as generator from "@babel/generator"
import * as parser from "@babel/parser"
import {
    ClassDeclaration,
    isClassDeclaration,
    isExportDefaultDeclaration,
    isTypeAlias,
    Node,
    TypeAlias,
} from "@babel/types"
import fse from "fs-extra"
import * as path from "path"

export async function analyzeBabel(dir: string, relativeFiles: string[]) {
    const types: (ClassDeclaration | TypeAlias)[] = []
    for (const relativeFile of relativeFiles) {
        const srcFile = path.join(dir, relativeFile)

        const sourceFile = parser.parse(await fse.readFile(srcFile, "utf8"), {
            sourceType: "module",
            sourceFilename: srcFile,
            plugins: ["jsx", "flow", "classProperties"],
        })
        for (const node of sourceFile.program.body) {
            if (isExportDefaultDeclaration(node)) {
                const decl = node.declaration
                if (isClassDeclaration(decl) || isTypeAlias(decl)) {
                    types.push(decl)
                }
            }
        }
    }
    for (const decl of types) {
        if (!isClassDeclaration(decl)) continue
        if (!decl.superTypeParameters || !decl.superTypeParameters.params.length) continue
        const propsTypeName = toJS(decl.superTypeParameters.params[0])

        console.log(decl.id.name, propsTypeName)
    }
    //console.log(types.map(t => t.id.name))
}

function toJS(node: Node): string {
    return generator.default(node).code
}
