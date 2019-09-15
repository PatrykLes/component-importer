import glob from "glob"
import prettier from "prettier"
import * as ts from "typescript"
import * as path from "path"

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

export function upperCaseFirstLetter(s: string): string {
    return (s && s[0].toUpperCase() + s.substr(1)) || ""
}

/**
 * Adds the given extension to `file` unless `file` already has the given extension.
 *
 * Example:
 *
 * ```ts
 * ensureExtension("foo.tsx", "tsx") // => "foo.tsx"
 * ensureExtension("foo/bar","tsx")  // => "foo/bar.tsx"
 * ```
 */
export function ensureExtension(file: string, extension: string): string {
    // Appending a "." to the extension is required since extname returns ".png" instead of "png".
    const dotExtension = extension.startsWith(".") ? extension : `.${extension}`
    if (path.extname(file) === dotExtension) {
        return file
    }
    return `${file}.${extension}`
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

/**
 * Splits a string into words.
 *
 * Example:
 *
 * ```ts
 * splitWords("helloFriend") === ["hello","Friend"]
 * splitWords("fooBarBaz") === ["foo", "Bar", "Baz"]
 * ```
 */
export function splitWords(str: string) {
    const result: string[] = []
    const remainingChars = str.split("")
    let currentWord = remainingChars.shift() || ""

    while (remainingChars.length > 0) {
        const char = remainingChars.shift()
        const previousChar = currentWord[currentWord.length - 1]

        // Case 1: is a separator char
        // Exmaple: aria-label
        //              ^
        if (/_|-/.test(char) && currentWord.length > 0) {
            result.push(currentWord)
            currentWord = ""
        }
        // Case 2: the current character is an uppercase character
        //         and the previous character was lowercased
        // Example: ariaLabel
        //              ^
        else if (/[A-Z]/.test(char) && /[a-z]/.test(previousChar)) {
            result.push(currentWord)
            currentWord = char
        } else {
            currentWord += char
        }
    }

    if (currentWord.length > 0) {
        result.push(currentWord)
    }

    return result
}
