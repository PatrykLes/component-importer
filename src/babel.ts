import * as generator from "@babel/generator"
import * as parser from "@babel/parser"
import {
    ClassDeclaration,
    FlowType,
    isBooleanTypeAnnotation,
    isClassDeclaration,
    isExportDefaultDeclaration,
    isExportNamedDeclaration,
    isGenericTypeAnnotation,
    isNullableTypeAnnotation,
    isNumberTypeAnnotation,
    isObjectTypeAnnotation,
    isObjectTypeProperty,
    isStringTypeAnnotation,
    isTypeAlias,
    Node,
    TypeAlias,
} from "@babel/types"
import fse from "fs-extra"
import { ComponentInfo, ProcessedFile, TypeInfo } from "./types"

export async function analyzeBabel(files: string[]): Promise<BabelProcessedFile[]> {
    const processed: BabelProcessedFile[] = []
    const types: (ClassDeclaration | TypeAlias)[] = []
    for (const srcFile of files) {
        // const srcFile = path.join(dir, relativeFile)
        const file: BabelProcessedFile = {
            srcFile: srcFile,
            // relativeFile,
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
    const right = node.right
    return toTypeInfo(right)
}
function toTypeInfo(type: FlowType): TypeInfo {
    if (!type) return null
    if (isObjectTypeAnnotation(type)) {
        const typeInfo: TypeInfo = { rawType: type, properties: [] }
        for (const prop of type.properties) {
            if (!isObjectTypeProperty(prop)) continue
            typeInfo.properties.push({ name: toJS(prop.key), type: toTypeInfo(prop.value), doc: null })
        }
        return typeInfo
    }
    if (isGenericTypeAnnotation(type)) {
        return { name: toJS(type.id), rawType: type }
    }
    if (isBooleanTypeAnnotation(type)) {
        return { name: "boolean", rawType: type }
    }
    if (isStringTypeAnnotation(type)) {
        return { name: "string", rawType: type }
    }
    if (isNumberTypeAnnotation(type)) {
        return { name: "number", rawType: type }
    }
    if (isNullableTypeAnnotation(type)) {
        const typeInfo = toTypeInfo(type.typeAnnotation)
        typeInfo.rawType = type
        return typeInfo
    }
    console.log("unknown type", type.type)
    return null
}

export interface BabelProcessedFile extends ProcessedFile {
    types: (ClassDeclaration | TypeAlias)[]
}
