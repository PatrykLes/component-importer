import * as ts from "typescript"
import * as fse from "fs-extra"
import prettier from "prettier"
import glob from "glob"
import path from "path"

async function main() {
    if (!process.argv[2]) {
        console.log("")
        console.log("Usage:")
        console.log("yarn cli [file-pattern] [out-dir]")
        console.log("")
        console.log("Example:")
        console.log("yarn cli ../my-project/src/**/*.tsx ../my-project/framer")
        console.log("")
        return
    }
    const pattern = process.argv[2] //"../framer-bridge-starter-kit/design-system/components/Button.tsx"
    const outDir = process.argv[3]
    const files = await new Promise<string[]>(resolve => glob(pattern, (err, files) => resolve(files)))
    console.log(files)
    for (const file of files) {
        console.log("Processing", file)
        const code = await processFile(file)
        if (!code) {
            console.log("Skipping", file)
            continue
        }
        if (!outDir) {
            console.log(code)
            continue
        }
        const outFile = path.join(outDir, path.basename(file))
        console.log("Saving", outFile)
        await fse.ensureDir(path.dirname(outFile))
        await fse.writeFile(outFile, code)
    }
}

function getLiteralTypeText(node: ts.LiteralTypeNode) {
    const literal = node.literal
    if (ts.isLiteralExpression(literal)) return literal.text
    return null
}
async function processFile(file: string): Promise<string> {
    const contents = await fse.readFile(file, "utf8")
    const sourceFile = ts.createSourceFile(file, contents, ts.ScriptTarget.ESNext, true, ts.ScriptKind.TSX)
    const name = findComponentName(sourceFile)
    const propsType = findPropsType(sourceFile)
    if (!name) {
        console.log("Can't find component in file")
    }
    if (!propsType) {
        console.log("Can't find props in file")
    }
    if (!name || !propsType) return null
    const propertyControls: PropertyControl[] = []
    if (propsType) {
        for (const me of propsType.members) {
            if (ts.isPropertySignature(me)) {
                let pc = new PropertyControl({ name: me.name.getText() })
                pc.title = upperCaseFirstLetter(pc.name)
                const meType = me.type
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
                        me.name.getText(),
                        me.type.getText(),
                        ts.SyntaxKind[me.type.kind],
                    )
                }
                if (!type) continue
                pc.type = type
                propertyControls.push(pc)
            }
        }
    }
    let code = generate({ componentName: `System.${name}`, framerName: name, propertyControls })
    const code2 = await makePrettier({ file, code })
    return code2
}

function upperCaseFirstLetter(s: string): string {
    return s[0].toUpperCase() + s.substr(1)
}
function findPropsType(sourceFile: ts.SourceFile): ts.TypeLiteralNode {
    for (const node of sourceFile.statements) {
        if (ts.isTypeAliasDeclaration(node)) {
            const type = node.type
            if (ts.isTypeLiteralNode(type)) return type
        }
    }
    console.warn("Couldn't find Props in file", sourceFile.fileName)
    return null
}
function findComponentName(sourceFile: ts.SourceFile): string {
    for (const node of sourceFile.statements) {
        if (ts.isVariableStatement(node)) {
            return node.declarationList.declarations[0].name.getText()
        }
    }
    console.warn("Couldn't find Component name in file", sourceFile.fileName)
    return null
}

function* descendants(node: ts.Node): IterableIterator<ts.Node> {
    const stack = [node]
    while (stack.length) {
        const node = stack.pop()
        yield node
        stack.push(...node.getChildren())
    }
}

main()

function generate(config: { componentName: string; framerName: string; propertyControls: PropertyControl[] }) {
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

  static propertyControls: PropertyControls<Props> = ${PropertyControl.toJS(propertyControls)}
}
`

    /*
{
    text: { type: ControlType.String, title: "Text" },
    kind: {
      type: ControlType.Enum,
      options: ["default", "primary", "danger"],
      optionTitles: ["Default", "Primary", "Danger"]
    },
    disabled: { type: ControlType.Boolean, title: "Disabled" },
    fluid: { type: ControlType.Boolean, title: "Fluid" }
  }
  */
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
    toTS() {
        const props = { ...this }
        delete props.name
        const obj2 = ts.createObjectLiteral(
            Object.entries(props).map(([name, value]) =>
                ts.createPropertyAssignment(
                    name,
                    name == "title" ? ts.createLiteral(value) : ts.createIdentifier(value),
                ),
            ),
        )
        const obj = ts.createPropertyAssignment(this.name, obj2)
        return obj
    }
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
    static toJS2(list: PropertyControl[]) {
        const assignments = list.map(t => t.toTS())
        const obj = ts.createObjectLiteral(assignments)
        return printExpression(obj)
    }
}

function valueToTS(obj: any, replacer?: (key: string, value: any) => ts.Expression, parentKey?: string): ts.Expression {
    if (replacer) {
        const replaced = replacer(parentKey, obj)
        if (replaced != null) {
            return replaced
        }
    }
    if (obj == null) return ts.createNull()
    if (typeof obj == "object") {
        if (obj instanceof Array) {
            const items = obj.map(t => valueToTS(t, replacer))
            const node = ts.createArrayLiteral(items)
            return node
        }
        const items = []
        for (const [key, value] of Object.entries(obj)) {
            items.push(ts.createPropertyAssignment(key, valueToTS(value, replacer, key)))
        }
        const node = ts.createObjectLiteral(items)
        return node
    }
    return ts.createLiteral(obj)
}

function printExpression(node: ts.Node) {
    const file = ts.createSourceFile("ggg", "", ts.ScriptTarget.ESNext, true, ts.ScriptKind.TSX)
    const printer = ts.createPrinter({
        newLine: ts.NewLineKind.LineFeed,
    })
    const result = printer.printNode(ts.EmitHint.Expression, node, file)
    return result
}

export async function makePrettier({ file, code }: { file: string; code: string }): Promise<string> {
    try {
        const options = await prettier.resolveConfig(file)
        if (options && !options.parser) {
            options.parser = "typescript"
        }
        const prettyCode = prettier.format(code, options)
        return prettyCode
    } catch (err) {
        console.log(err)
    }
    return code
}
