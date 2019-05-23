import path from "path"
import * as ts from "typescript"
import { ComponentInfo, ProcessedFile, PropertyControl, PropertyControls, PropertyInfo, TypeInfo } from "./types"
import { upperCaseFirstLetter } from "./utils"

let program: ts.Program
export async function processProgram(dir: string, relativeFiles: string[]): Promise<ProcessedFile[]> {
    const processed: ProcessedFile[] = relativeFiles.map(
        t =>
            <ProcessedFile>{
                relativeFile: t,
                file: path.join(dir, t),
            },
    )
    let tsconfig: ts.CompilerOptions = {
        rootDir: dir,
        target: ts.ScriptTarget.ESNext,
        jsx: ts.JsxEmit.React,
        typeRoots: [],
    }
    let opts: ts.CreateProgramOptions = {
        options: tsconfig,
        rootNames: processed.map(t => t.file),
    }
    program = ts.createProgram(opts)
    console.log(program.getSourceFiles().length)
    for (const file of processed) {
        const sourceFile = program.getSourceFile(file.file)
        if (!sourceFile || sourceFile.isDeclarationFile) continue
        console.log("SOURCE FILE", sourceFile.fileName)
        await analyze(sourceFile, file)
    }
    return processed
}

function analyze(sourceFile: ts.SourceFile, processedFile: ProcessedFile) {
    processedFile.components = Array.from(findComponents(sourceFile))
}
export function convert(comp: ComponentInfo) {
    comp.propertyControls = new PropertyControls()

    // if (!comp) console.warn("Can't find component in file")
    // if (!propsType) console.warn("Can't find props in file")
    // if (!comp || !propsType) return res

    comp.componentName = `System.${comp.name}`
    comp.framerName = comp.name
    for (const prop of comp.propsTypeInfo.properties) {
        let pc = new PropertyControl({ name: prop.name })
        pc.title = upperCaseFirstLetter(pc.name)
        const meType = prop.type
        let type: string
        if (meType.isEnum) {
            type = "ControlType.Enum"
            pc.options = meType.possibleValues
            pc.optionTitles = pc.options.map(t => upperCaseFirstLetter(String(t)))
        } else if (meType.name == "string") {
            type = "ControlType.String"
        } else if (meType.name == "boolean") {
            type = "ControlType.Boolean"
        } else {
            console.log("Skipping PropertyControl for", prop.name)
            continue
        }
        pc.type = type
        comp.propertyControls.add(pc)
    }
}
export function generate(analyzedFile: ProcessedFile) {
    const sb = []
    for (const comp of analyzedFile.components) {
        const { componentName, framerName, propertyControls } = comp
        sb.push(`
    import * as React from "react"
    import * as System from "../../design-system"
    import { ControlType, PropertyControls } from "framer"
    
    type Props = ${componentName}Props & {
      width: number
      height: number
    }
    
    export class ${framerName} extends React.Component<Props> {
      render() {
        return <${componentName} {...this.props} />
      }
    
      static defaultProps: Props = {
        width: 150,
        height: 50,
      }
    
      static propertyControls: PropertyControls<Props> = ${propertyControls.toJS()}
    }
    `)
    }
    return sb.join("")
}

function* findComponents(sourceFile: ts.SourceFile): IterableIterator<ComponentInfo> {
    for (const node of sourceFile.statements) {
        if (!ts.isVariableStatement(node)) continue
        const decl = node.declarationList.declarations[0]
        if (!decl) continue
        const name = (decl.name as ts.Identifier).text
        const typeNode = decl.type
        if (!typeNode) continue
        let type: ts.Type
        if (program) {
            const checker = program.getTypeChecker()
            type = checker.getTypeFromTypeNode(getFirstGenericArgument(decl.type))
        }
        const checker = program.getTypeChecker()
        yield {
            name,
            propsTypeInfo: toTypeInfo(type, checker),
            componentName: null,
            framerName: null,
            propertyControls: null,
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
    const typeInfo: TypeInfo = {}
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
            let pc: PropertyInfo = { name: prop.name, type: toTypeInfo(meType, checker) }
            typeInfo.properties.push(pc)
        }
    }
    return typeInfo
}
