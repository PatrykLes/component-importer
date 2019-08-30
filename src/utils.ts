import glob from "glob"
import prettier from "prettier"
import * as ts from "typescript"

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

export function flatMap<T, K>(array: Iterable<T>, mapper: (item: T) => K[]) {
    return Array.from(array)
        .map(mapper)
        .reduce((res, arr) => {
            res.push(...arr)
            return res
        }, [])
}

export function indexBy<T>(array: Iterable<T>, groupingFunction: (item: T) => string) {
    const map: Record<string, T> = {}

    for (const item of array) {
        map[groupingFunction(item)] = item
    }

    return map
}

export function indexByRemovingKey<T extends Record<string, any>, K extends keyof T>(
    array: Iterable<T>,
    key: K,
): Record<string, Omit<T, K>> {
    const map: Record<string, Omit<T, K>> = {}

    for (const item of array) {
        const { [key]: groupingKey, ...rest } = item

        map[groupingKey] = rest
    }

    return map
}

export function mapValues<T, K>(obj: Record<string, T>, mapper: (item: T) => K) {
    const result: Record<string, K> = {}
    for (const key of Object.keys(obj)) {
        const value = obj[key]
        result[key] = mapper(value)
    }
    return result
}

/**
 * Meant to be used as a quick way to create comparator's for Array#sort
 *
 * Example:
 *
 * ```ts
 * [{a:4}, {a:5}, {a:1}].sort(byKey(x => x.a))
 * // will result in
 * [{a:1}, {a:4}, {a:5}]
 * ```
 */
export function byKey<T, K>(extractor: (k: T) => K) {
    return (left: T, right: T) => {
        const valueLeft = extractor(left)
        const valueRight = extractor(right)
        if (valueLeft === valueRight) {
            return 0
        }
        return valueLeft < valueRight ? -1 : +1
    }
}
