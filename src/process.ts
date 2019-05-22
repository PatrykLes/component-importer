import * as fse from "fs-extra"
import * as ts from "typescript"
import { getLiteralTypeText, makePrettier, printExpression, upperCaseFirstLetter, valueToTS } from "./utils"

export async function processFile(file: string): Promise<string> {
    const contents = await fse.readFile(file, "utf8")
    const analyzed = analyze(file, contents)
    let code = generate(analyzed)
    const code2 = await makePrettier({ file, code })
    return code2
}

function analyze(file: string, contents: string): AnalyzedFile {
    const sourceFile = ts.createSourceFile(file, contents, ts.ScriptTarget.ESNext, true, ts.ScriptKind.TSX)
    const comp = findComponentNameAndType(sourceFile)
    const propsTypeName = getFirstGenericArgument(comp.type).getText()
    const propsType = findPropsType(sourceFile, propsTypeName)
    const res: AnalyzedFile = {
        file,
        componentName: null,
        framerName: null,
        propertyControls: new PropertyControls(),
    }

    if (!comp) console.warn("Can't find component in file")
    if (!propsType) console.warn("Can't find props in file")
    if (!comp || !propsType) return res

    res.componentName = `System.${comp.name}`
    res.framerName = comp.name

    for (const prop of propsType.members.filter(ts.isPropertySignature)) {
        let pc = new PropertyControl({ name: prop.name.getText() })
        pc.title = upperCaseFirstLetter(pc.name)
        const meType = prop.type
        const meTypeName = meType.getText()
        let type: string
        if (meTypeName == "string") {
            type = "ControlType.String"
        } else if (meTypeName == "boolean") {
            type = "ControlType.Boolean"
        } else if (ts.isUnionTypeNode(meType)) {
            type = "ControlType.Enum"
            pc.options = meType.types.map(t => (ts.isLiteralTypeNode(t) ? getLiteralTypeText(t) : ""))
            pc.optionTitles = pc.options.map(t => upperCaseFirstLetter(t))
        } else {
            console.log(
                "Skipping PropertyControl for",
                prop.name.getText(),
                prop.type.getText(),
                ts.SyntaxKind[prop.type.kind],
            )
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
function findComponentNameAndType(sourceFile: ts.SourceFile): NameAndType {
    const node = sourceFile.statements.find(ts.isVariableStatement)
    if (!node) return null
    const decl = node.declarationList.declarations[0]
    const name = decl.name.getText()
    const type = decl.type
    return { name, type }
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
    options: string[]
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

interface NameAndType {
    name: string
    type: ts.TypeNode
}
