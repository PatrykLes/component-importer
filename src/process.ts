import * as fse from "fs-extra"
import * as ts from "typescript"
import path from "path"
import { getLiteralTypeText, makePrettier, printExpression, upperCaseFirstLetter, valueToTS } from "./utils"

let program: ts.Program
export async function processProgram(dir: string, relativeFiles: string[]) {
    let tsconfig: ts.CompilerOptions = {
        rootDir: dir,
        target: ts.ScriptTarget.ESNext,
        jsx: ts.JsxEmit.React,
        typeRoots: [], //[path.join(dir, "node_modules")],
    }
    let opts: ts.CreateProgramOptions = {
        options: tsconfig,
        rootNames: relativeFiles.map(t => path.join(dir, t)),
    }
    console.log(opts)
    program = ts.createProgram(opts)
    // // Get the checker, we will use it to find more about classes
    // let checker = program.getTypeChecker()

    // Visit every sourceFile in the program
    console.log(program.getSourceFiles().length)
    for (const sourceFile of program.getSourceFiles()) {
        if (!sourceFile.isDeclarationFile) {
            console.log("SOURCE FILE", sourceFile.fileName)
            // processFile(sourceFile)
        } else {
            // console.log("DECL FILE", sourceFile.fileName)
        }
    }
}

export async function processFile(file: string): Promise<string> {
    let sourceFile: ts.SourceFile
    if (program) {
        sourceFile = program.getSourceFile(file)
    } else {
        const contents = await fse.readFile(file, "utf8")
        sourceFile = ts.createSourceFile(file, contents, ts.ScriptTarget.ESNext, true, ts.ScriptKind.TSX)
    }
    const analyzed = analyze(sourceFile)
    let code = generate(analyzed)
    const code2 = await makePrettier({ file, code })
    return code2
}

function analyze(sourceFile: ts.SourceFile): AnalyzedFile {
    const comp = findComponent(sourceFile)
    const propsType = comp.propsType
    const res: AnalyzedFile = {
        file: sourceFile.fileName,
        componentName: null,
        framerName: null,
        propertyControls: new PropertyControls(),
    }

    if (!comp) console.warn("Can't find component in file")
    if (!propsType) console.warn("Can't find props in file")
    if (!comp || !propsType) return res

    res.componentName = `System.${comp.name}`
    res.framerName = comp.name

    const checker = program.getTypeChecker()
    for (const prop of propsType.getProperties()) {
        let pc = new PropertyControl({ name: prop.name })
        pc.title = upperCaseFirstLetter(pc.name)
        const meType = checker.getTypeAtLocation(prop.valueDeclaration)
        let type: string
        if (meType.isUnion()) {
            type = "ControlType.Enum"
            pc.options = meType.types.map(t => (t.isLiteral() ? (t.value as string | number) : ""))
            pc.optionTitles = pc.options.map(t => upperCaseFirstLetter(String(t)))
        } else if ((meType.getFlags() & ts.TypeFlags.String) == ts.TypeFlags.String) {
            type = "ControlType.String"
        } else if ((meType.getFlags() & ts.TypeFlags.Boolean) == ts.TypeFlags.Boolean) {
            type = "ControlType.Boolean"
        } else {
            console.log("Skipping PropertyControl for", prop.name)
            continue
        }
        pc.type = type
        res.propertyControls.add(pc)
    }
    return res
}
function generate(config: AnalyzedFile) {
    const { componentName, framerName, propertyControls } = config
    return `
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
`
}

function findPropsType(sourceFile: ts.SourceFile, name: string): ts.InterfaceDeclaration | ts.TypeLiteralNode {
    const nodes = sourceFile.statements
        .map(t => (ts.isTypeAliasDeclaration(t) || ts.isInterfaceDeclaration(t) ? t : null))
        .filter(t => t != null)
    for (const node of nodes) {
        if (node.name.getText() != name) continue
        if (ts.isTypeAliasDeclaration(node)) {
            const type = node.type
            if (ts.isTypeLiteralNode(type)) {
                return type
            }
        }
        if (ts.isInterfaceDeclaration(node)) {
            return node
        }
    }
    return null
}
function findComponent(sourceFile: ts.SourceFile): ComponentInfo {
    for (const node of sourceFile.statements) {
        if (!ts.isVariableStatement(node)) continue
        //const node = sourceFile.statements.find(ts.isVariableStatement)
        // if (!node) return null
        const decl = node.declarationList.declarations[0]
        if (!decl) continue
        // console.log(decl.getText())
        const name = (decl.name as ts.Identifier).text
        const typeNode = decl.type
        let type: ts.Type
        if (program) {
            const checker = program.getTypeChecker()
            type = checker.getTypeFromTypeNode(getFirstGenericArgument(decl.type))
        }
        return { name, propsTypeNode: typeNode, propsType: type }
    }
}

function getFirstGenericArgument(type: ts.TypeNode): ts.TypeNode {
    if (ts.isTypeReferenceNode(type)) {
        const genericArgType = type.typeArguments[0]
        return genericArgType
    }
    return null
}

class PropertyControls {
    add(pc: PropertyControl) {
        this.items.push(pc)
    }
    toJS() {
        return PropertyControl.toJS(this.items)
    }
    items: PropertyControl[] = []
}
class PropertyControl {
    constructor(opts?: Partial<PropertyControl>) {
        opts && Object.assign(this, opts)
    }
    name: string
    type: string
    options: (string | number)[]
    optionTitles: string[]
    title: string
    toEntry(): [string, any] {
        const props = { ...this }
        delete props.name
        return [this.name, props]
    }
    static toJS(list: PropertyControl[]) {
        const entries = list.map(t => t.toEntry())
        const obj: any = {}
        for (const entry of entries) obj[entry[0]] = entry[1]
        const node = valueToTS(obj, (key, value) => {
            if (key == "type") {
                return ts.createIdentifier(value)
            }
        })
        return printExpression(node)
    }
}

interface AnalyzedFile {
    file: string
    componentName: string
    framerName: string
    propertyControls: PropertyControls
}

interface ComponentInfo {
    name: string
    propsTypeNode: ts.TypeNode
    propsType: ts.Type
}
