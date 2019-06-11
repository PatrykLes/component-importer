import path from "path"
import * as ts from "typescript"
import { ComponentInfo, ProcessedFile, PropertyInfo, TypeInfo } from "./types"

export async function analyzeTypeScript(files: string[]): Promise<ProcessedFile[]> {
    const processed: ProcessedFile[] = files.map(
        t =>
            <ProcessedFile>{
                // relativeFile: t,
                srcFile: t,
            },
    )
    let tsconfig: ts.CompilerOptions = {
        //rootDir: dir,
        target: ts.ScriptTarget.ESNext,
        jsx: ts.JsxEmit.React,
        typeRoots: [],
    }
    let opts: ts.CreateProgramOptions = {
        options: tsconfig,
        rootNames: processed.map(t => t.srcFile),
    }
    const program = ts.createProgram(opts)
    console.log(program.getSourceFiles().length)
    program.getTypeChecker() // to make sure the parent nodes are set
    for (const file of processed) {
        const sourceFile = program.getSourceFile(file.srcFile)
        if (!sourceFile || sourceFile.isDeclarationFile) continue
        console.log("SOURCE FILE", sourceFile.fileName)
        await analyze(sourceFile, file, program)
    }
    return processed
}

function analyze(sourceFile: ts.SourceFile, processedFile: ProcessedFile, program: ts.Program) {
    processedFile.components = Array.from(findComponents(sourceFile, program))
}

function* findComponents(sourceFile: ts.SourceFile, program: ts.Program): IterableIterator<ComponentInfo> {
    for (const node of sourceFile.statements) {
        if (!ts.isVariableStatement(node)) continue
        const decl = node.declarationList.declarations[0]
        if (!decl) continue
        const name = (decl.name as ts.Identifier).text
        const typeNode = decl.type
        if (!typeNode) continue
        let type: ts.Type
        const checker = program.getTypeChecker()
        type = checker.getTypeFromTypeNode(getFirstGenericArgument(decl.type))
        yield {
            name,
            propsTypeInfo: toTypeInfo(type, checker),
        }
    }
}

function getFirstGenericArgument(type: ts.TypeNode): ts.TypeNode {
    if (ts.isTypeReferenceNode(type)) {
        const genericArgType = type.typeArguments[0]
        return genericArgType
    }
    return null
}

function toTypeInfo(type: ts.Type, checker: ts.TypeChecker): TypeInfo {
    const typeInfo: TypeInfo = { rawType: type }
    if ((type.getFlags() & ts.TypeFlags.String) == ts.TypeFlags.String) {
        typeInfo.name = "string"
    } else if ((type.getFlags() & ts.TypeFlags.Boolean) == ts.TypeFlags.Boolean) {
        typeInfo.name = "boolean"
    } else if (type.isUnion()) {
        typeInfo.isEnum = true
        typeInfo.possibleValues = type.types.map(t => (t.isLiteral() ? (t.value as string | number) : ""))
    } else {
        // TODO: typeInfo.name = type.name
        typeInfo.properties = []
        for (const prop of type.getProperties()) {
            const meType = checker.getTypeAtLocation(prop.valueDeclaration)
            let pc: PropertyInfo = {
                name: prop.name,
                type: toTypeInfo(meType, checker),
                doc: ts.displayPartsToString(prop.getDocumentationComment(checker)),
            }
            typeInfo.properties.push(pc)
        }
    }
    return typeInfo
}
