import * as generator from "@babel/generator"
import * as parser from "@babel/parser"
import {
    ClassDeclaration,
    isClassDeclaration,
    isExportDefaultDeclaration,
    isTypeAlias,
    Node,
    TypeAlias,
    isExportNamedDeclaration,
    isObjectTypeAnnotation,
    isObjectTypeProperty,
    FlowType,
    isGenericTypeAnnotation,
    isBooleanTypeAnnotation,
    isStringTypeAnnotation,
    isNumberTypeAnnotation,
    isNullableTypeAnnotation,
} from "@babel/types"
import fse from "fs-extra"
import * as path from "path"
import { ProcessedFile, ComponentInfo, TypeInfo } from "./types"

export async function analyzeBabel(dir: string, relativeFiles: string[]): Promise<BabelProcessedFile[]> {
    const processed: BabelProcessedFile[] = []
    const types: (ClassDeclaration | TypeAlias)[] = []
    for (const relativeFile of relativeFiles) {
        const srcFile = path.join(dir, relativeFile)
        const file: BabelProcessedFile = {
            file: srcFile,
            relativeFile,
            components: [],
            types: [],
        }
        processed.push(file)

        const sourceFile = parser.parse(await fse.readFile(srcFile, "utf8"), {
            sourceType: "module",
            sourceFilename: srcFile,
            plugins: ["jsx", "flow", "classProperties"],
        })
        for (const node of sourceFile.program.body) {
            // console.log(relativeFile, node.type)
            if (isExportDefaultDeclaration(node) || isExportNamedDeclaration(node)) {
                const decl = node.declaration
                if (isClassDeclaration(decl) || isTypeAlias(decl)) {
                    types.push(decl)
                    file.types.push(decl)
                }
            }
        }
    }

    for (const file of processed) {
        for (const decl of file.types) {
            // console.log(decl.id.name)
            if (!isClassDeclaration(decl)) continue
            if (!decl.superTypeParameters || !decl.superTypeParameters.params.length) continue
            const propsTypeName = toJS(decl.superTypeParameters.params[0])
            const propsTypeDecl = types.find(t => t.id.name == propsTypeName)
            if (propsTypeDecl) {
                console.log(decl.id.name, propsTypeDecl.id.name)
                const comp: ComponentInfo = {
                    name: decl.id.name,
                    propsTypeInfo: typeAliasToTypeInfo(propsTypeDecl),
                    propertyControls: null,
                    componentName: null,
                    framerName: null,
                }
                file.components.push(comp)
                break
            }
            // console.log(decl.id.name, propsTypeName)
        }
    }
    //console.log(types.map(t => t.id.name))
    return processed
}

function toJS(node: Node): string {
    return generator.default(node).code
}

function typeAliasToTypeInfo(node: TypeAlias | ClassDeclaration): TypeInfo {
    if (!isTypeAlias(node)) return null
    // console.log(node.right)
    const typeInfo: TypeInfo = {
        name: node.id.name,
    }
    const right = node.right
    return toTypeInfo(right)
}
function toTypeInfo(type: FlowType): TypeInfo {
    if (!type) return null
    const typeInfo: TypeInfo = {}
    if (isObjectTypeAnnotation(type)) {
        typeInfo.properties = []
        for (const prop of type.properties) {
            if (!isObjectTypeProperty(prop)) continue
            typeInfo.properties.push({ name: toJS(prop.key), type: toTypeInfo(prop.value) })
        }
    } else if (isGenericTypeAnnotation(type)) {
        return { name: toJS(type.id) }
    } else if (isBooleanTypeAnnotation(type)) {
        return { name: "boolean" }
    } else if (isStringTypeAnnotation(type)) {
        return { name: "string" }
    } else if (isNumberTypeAnnotation(type)) {
        return { name: "number" }
    } else if (isNullableTypeAnnotation(type)) {
        return toTypeInfo(type.typeAnnotation)
    } else {
        console.log("unknown type", type.type)
        return null
    }
    return typeInfo
}

export interface BabelProcessedFile extends ProcessedFile {
    types: (ClassDeclaration | TypeAlias)[]
}
