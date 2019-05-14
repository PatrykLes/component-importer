import * as ts from "typescript"
import * as fse from "fs-extra"
import prettier from "prettier"
import glob from "glob"
import path from "path"
async function main() {
    const pattern = process.argv[2] //"../framer-bridge-starter-kit/design-system/components/Button.tsx"
    const outDir = process.argv[3]
    const files = await new Promise<string[]>(resolve => glob(pattern, (err, files) => resolve(files)))
    console.log(files)
    for (const file of files) {
        const code = await processFile(file)
        if (!outDir) {
            console.log(code)
            continue
        }
        const outFile = path.join(outDir, path.basename(file))
        console.log(outFile)
        await fse.ensureDir(outDir)
        await fse.writeFile(outFile, code)
    }
}
async function processFile(file: string) {
    const contents = await fse.readFile(file, "utf8")
    const sourceFile = ts.createSourceFile(file, contents, ts.ScriptTarget.ESNext, true, ts.ScriptKind.TSX)
    const propsType = findPropsType(sourceFile)
    const propertyControls: PropertyControl[] = []
    if (propsType) {
        for (const me of propsType.members) {
            if (ts.isPropertySignature(me)) {
                const meType = me.type.getText()
                let type: string
                if (meType == "string") {
                    type = "ControlType.String"
                } else if (meType == "boolean") {
                    type = "ControlType.Boolean"
                }
                if (!type) continue
                propertyControls.push(
                    new PropertyControl({
                        name: me.name.getText(),
                        type,
                        title: upperCaseFirstLetter(me.name.getText()),
                    }),
                )
            }
        }
    }
    const name = findComponentName(sourceFile)
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
    return null
}
function findComponentName(sourceFile: ts.SourceFile): string {
    for (const node of sourceFile.statements) {
        if (ts.isVariableStatement(node)) {
            return node.declarationList.declarations[0].name.getText()
        }
    }
}

function* iterate(node: ts.Node): IterableIterator<ts.Node> {
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

type Props = ${componentName} & {
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
    static toJS(list: PropertyControl[]) {
        const assignments = list.map(t => t.toTS())
        const obj = ts.createObjectLiteral(assignments)
        return printExpression(obj)
    }
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
