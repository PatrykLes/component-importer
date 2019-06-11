import prettier from "prettier"
import * as ts from "typescript"

export function valueToTS(
    obj: any,
    replacer?: (key: string, value: any) => ts.Expression,
    parentKey?: string,
): ts.Expression {
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
            const prop = ts.createPropertyAssignment(key, valueToTS(value, replacer, key))
            items.push(prop)
        }
        const node = ts.createObjectLiteral(items)
        return node
    }
    return ts.createLiteral(obj)
}

export function printExpression(node: ts.Node) {
    const file = ts.createSourceFile("ggg", "", ts.ScriptTarget.ESNext, true, ts.ScriptKind.TSX)
    const printer = ts.createPrinter({
        newLine: ts.NewLineKind.LineFeed,
    })
    const result = printer.printNode(ts.EmitHint.Expression, node, file)
    return result
}

export async function makePrettier({ file, code }: { file: string; code: string }): Promise<string> {
    try {
        const options = (await prettier.resolveConfig(file)) || {}
        options.parser = "typescript"
        const prettyCode = prettier.format(code, options)
        return prettyCode
    } catch (err) {
        console.log(err)
    }
    return code
}

export function getLiteralTypeText(node: ts.LiteralTypeNode) {
    const literal = node.literal
    if (ts.isLiteralExpression(literal)) return literal.text
    return null
}

export function upperCaseFirstLetter(s: string): string {
    return (s && s[0].toUpperCase() + s.substr(1)) || ""
}

export function* descendants(node: ts.Node): IterableIterator<ts.Node> {
    const stack = [node]
    while (stack.length) {
        const node = stack.pop()
        yield node
        stack.push(...node.getChildren())
    }
}

export function changeExtension(file: string, ext: string): string {
    var pos = file.lastIndexOf(".")
    file = file.substr(0, pos < 0 ? file.length : pos) + ext
    return file
}
