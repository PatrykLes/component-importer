import prettier from "prettier"
import * as ts from "typescript"
import glob from "glob"

export function valueToTS(
    obj: any,
    replacer?: (key: string, value: any) => ts.Expression,
    parentKey?: string,
): ts.Expression {
    if (replacer) {
        const replaced = replacer(parentKey, obj)
        if (replaced !== undefined) {
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
            const valueExp = valueToTS(value, replacer, key)
            if (valueExp == null) continue
            const prop = ts.createPropertyAssignment(key, valueExp)
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

/** Formats the given code using prettier, if an optional file is sent, the config for prettier will be resolved from there */
export async function makePrettier(code: string, file?: string): Promise<string> {
    try {
        const options = (file && (await prettier.resolveConfig(file))) || {}
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

export function globAsync(pattern: string, srcDir: string) {
    return new Promise<string[]>(resolve => glob(pattern, { cwd: srcDir }, (err, files) => resolve(files)))
}

/**
 * Gets a node's syntax kinds as strings. Meant for debugging.
 */
const getSyntaxKinds = (node: ts.Node): string[] => {
    return Object.keys(ts.SyntaxKind).filter(key => {
        // @ts-ignore
        const kind = ts.SyntaxKind[key]

        return (kind & node.kind) === kind
    })
}

const getNodeFlags = (node: ts.Node): string[] => {
    return Object.keys(ts.NodeFlags).filter(key => {
        // @ts-ignore
        const flag = ts.NodeFlags[key]

        return (flag & node.flags) === flag
    })
}

export const printDebugInfo = (node: ts.Node) => {
    console.log(
        [
            `kinds: ${getSyntaxKinds(node)}`,
            `children: ${node.getChildren().length} `,
            `text: ${node.getText()}`,
            `flags ${getNodeFlags(node)}`,
        ].join("\n"),
    )
}

export function flatMap<T, K>(array: Iterable<T>, mapper: (item: T) => K[]) {
    return Array.from(array)
        .map(mapper)
        .reduce((res, arr) => {
            res.push(...arr)
            return res
        }, [])
}
