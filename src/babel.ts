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
    isClassProperty,
    isIdentifier,
    isObjectExpression,
    ObjectExpression,
    isObjectProperty,
    isCallExpression,
    MemberExpression,
    Expression,
    isMemberExpression,
    isExpressionStatement,
    isAssignmentExpression,
    File,
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
            parsed: null,
        }
        processed.push(file)

        const sourceFile = parser.parse(await fse.readFile(srcFile, "utf8"), {
            sourceType: "module",
            sourceFilename: srcFile,
            plugins: ["jsx", "flow", "classProperties", "exportDefaultFrom"],
        })
        file.parsed = sourceFile
        for (const node of sourceFile.program.body) {
            let decl: Node = node
            // console.log(relativeFile, node.type)
            if (isExportDefaultDeclaration(node) || isExportNamedDeclaration(node)) {
                decl = node.declaration
            }
            if (isClassDeclaration(decl) || isTypeAlias(decl)) {
                types.push(decl)
                file.types.push(decl)
            }
        }
    }

    for (const file of processed) {
        for (const decl of file.types) {
            // if(isExpressionStatement(decl))
            // console.log(decl.id.name)
            if (!isClassDeclaration(decl)) continue
            if (!decl.superTypeParameters || !decl.superTypeParameters.params.length) {
                const propTypes = extractPropTypes(decl)
                if (propTypes) {
                    // console.log(propTypes)
                    const propsTypeInfo = propTypesToTypeInfo(propTypes)
                    // console.log(propsTypeInfo)
                    const comp: ComponentInfo = {
                        name: decl.id.name,
                        propsTypeInfo,
                    }
                    file.components.push(comp)
                }
                continue
            }
            const propsTypeName = toJS(decl.superTypeParameters.params[0])
            const propsTypeDecl = types.find(t => t.id.name == propsTypeName)
            if (propsTypeDecl) {
                console.log(decl.id.name, propsTypeDecl.id.name)
                const comp: ComponentInfo = {
                    name: decl.id.name,
                    propsTypeInfo: typeAliasToTypeInfo(propsTypeDecl),
                }
                file.components.push(comp)
            }
            // console.log(decl.id.name, propsTypeName)
        }
        for (const st of file.parsed.program.body) {
            if (isExpressionStatement(st)) {
                const exp = st.expression
                if (isAssignmentExpression(exp)) {
                    const left = exp.left
                    if (isMemberExpression(left)) {
                        const prop = left.property
                        const obj = left.object
                        if (isIdentifier(obj) && isIdentifier(prop) && prop.name == "propTypes") {
                            const right = exp.right
                            if (isObjectExpression(right)) {
                                file.components.push({
                                    name: obj.name,
                                    propsTypeInfo: propTypesToTypeInfo(right),
                                })
                                // console.log(file.components[file.components.length - 1].propsTypeInfo.properties)
                            }
                        }
                    }
                }
            }
        }
    }
    //console.log(types.map(t => t.id.name))
    return processed
}

function propTypesToTypeInfo(propTypes: ObjectExpression): TypeInfo {
    const typeInfo: TypeInfo = { properties: [] }
    for (const prop of propTypes.properties) {
        if (isObjectProperty(prop)) {
            const nameExp = prop.key
            if (isIdentifier(nameExp)) {
                const name = nameExp.name
                let member = prop.value
                if (isCallExpression(member)) {
                    member = member.callee
                }
                if (isMemberExpression(member)) {
                    const typeIdentifier = member.property
                    if (isIdentifier(typeIdentifier)) {
                        const propTypeName = typeIdentifier.name
                        typeInfo.properties.push({ name, type: { name: propTypeName } })
                    }
                }
            }
        }
    }
    return typeInfo
}
function extractPropTypes(ce: ClassDeclaration): ObjectExpression {
    for (const member of ce.body.body) {
        if (isClassProperty(member)) {
            const key = member.key
            if (isIdentifier(key) && key.name == "propTypes") {
                const value = member.value
                if (isObjectExpression(value)) {
                    return value
                }
            }
        }
    }
    return null
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
    parsed: File
    types: (ClassDeclaration | TypeAlias)[]
}
