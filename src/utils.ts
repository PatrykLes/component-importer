import glob from "glob"
import fs from "fs"
import util from "util"
import prettier from "prettier"
import * as ts from "typescript"
import * as path from "path"
import { namedTypes as t } from "ast-types"
import { NodePath } from "ast-types/lib/node-path"
import { Formatter } from "./types"

export const defaultPlainIgnorePatterns = [
    "**/node_modules/**",
    "**/stories/**",
    "**/__mocks__/**",
    "**/__examples__/**",
    "**/__tests__/**",
    "**/__docs__/**",
    "**/*.test.{js,jsx}",
    "**/*-test.{js,jsx}",
    "**/*.spec.{js,jsx}",
    "**/*-spec.{js,jsx}",
]

export const defaultFlowIgnorePatterns = [
    "**/node_modules/**",
    "**/stories/**",
    "**/__mocks__/**",
    "**/__examples__/**",
    "**/__tests__/**",
    "**/__docs__/**",
    "**/*.test.{js,jsx,flow}",
    "**/*-test.{js,jsx,flow}",
    "**/*.spec.{js,jsx,flow}",
    "**/*-spec.{js,jsx,flow}",
]

export const defaultPlainIncludePattern = "**/*.{js,jsx}"

export const defaultFlowIncludePattern = "**/*.{js,jsx,flow}"

const defaultPrettierConfig: prettier.Options = {
    parser: "typescript",
    tabWidth: 4,
    printWidth: 120,
    trailingComma: "all",
    semi: false,
}

export function getNameOrValue(path: NodePath, raw?: boolean): string {
    const node = path.node
    switch (node.type) {
        case (t.Identifier as any).name:
            return node.name
        case (t.Literal as any).name:
            return raw ? node.raw : node.value
        default:
            throw new TypeError("Argument must be an Identifier or a Literal")
    }
}

export function printNode(node: ts.Node, hint: ts.EmitHint): string {
    const file = ts.createSourceFile("ggg", "", ts.ScriptTarget.ESNext, true, ts.ScriptKind.TSX)
    const printer = ts.createPrinter(
        {
            newLine: ts.NewLineKind.LineFeed,
            removeComments: false,
        },
        {},
    )
    return printer.printNode(hint, node, file)
}

export function printExpression(node: ts.Node) {
    return printNode(node, ts.EmitHint.Expression)
}

/** Formats the given code using prettier, if an optional file is sent, the config for prettier will be resolved from there */
export async function makePrettier(code: string, file?: string): Promise<string> {
    try {
        const options: prettier.Options = (file && (await prettier.resolveConfig(file))) || defaultPrettierConfig
        const prettyCode = prettier.format(code, options)
        return prettyCode
    } catch (err) {
        console.log(err)
    }
    return code
}

export async function createPrettierFormatter(prettierrc?: string): Promise<Formatter> {
    const config: prettier.Options = prettierrc ? await prettier.resolveConfig(prettierrc) : defaultPrettierConfig

    return (code: string) => {
        try {
            return prettier.format(code, config)
        } catch (error) {
            console.log("Failed to format code", error)
            return code
        }
    }
}

export function findFilesAtImportPath(
    importPath: string,
    globPattern = defaultPlainIncludePattern,
    globIgnore = defaultPlainIgnorePatterns,
): string[] {
    if (fs.existsSync(importPath)) {
        const stat = fs.statSync(importPath)

        // Single file case
        if (stat.isFile()) {
            return [importPath]
        }

        // Directory case
        if (stat.isDirectory()) {
            const patternWithImportPath = path.join(importPath, globPattern)
            const ignoreWithImportPath = globIgnore.map(p => path.join(importPath, p))
            return glob.sync(patternWithImportPath, { ignore: ignoreWithImportPath })
        }
    }

    // Node module name case
    if (isModulePath(importPath)) {
        const modulePath = `./node_modules/${importPath}`
        const patternWithModulePath = path.join(modulePath, globPattern)
        const ignoreWithModulePath = globIgnore.map(p => path.join(modulePath, p))

        return glob.sync(patternWithModulePath, { ignore: ignoreWithModulePath })
    }

    return []
}

export function isModulePath(importPath: string) {
    const modulePath = `./node_modules/${importPath}`
    return fs.existsSync(modulePath) && fs.statSync(modulePath).isDirectory()
}

/**
 * Returns the path that will be used in the `import * as System from "[importPath]"` statement.
 * If the original import path was a module, or an absolute path, it will be preserved.
 * Otherwise, a relative path from the `outDir` to the original path will be generated.
 */

export function resolveComponentImportPath(importPath: string, outDir: string) {
    if (isModulePath(importPath) || path.isAbsolute(importPath)) {
        return importPath
    }

    return path.relative(outDir, importPath)
}

export function findDefaultIndex(importPath: string): string[] {
    const root = path.join("node_modules", importPath)
    const packageJsonPath = path.join(root, "package.json")
    if (!fs.existsSync(packageJsonPath)) {
        return []
    }

    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath).toString())

    // According to https://www.typescriptlang.org/docs/handbook/declaration-files/publishing.html
    // type definitions live either at:
    //
    // - package.json:types
    // - package.json:typings
    // - /index.d.ts
    const localPathToTypes = packageJson.typings || packageJson.types || "index.d.ts"

    return [path.join(root, localPathToTypes)]
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
        // Char is guaranteed to be present because remainingChars.length is non-empty
        const char = remainingChars.shift()!
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

/**
 * @return an array of all items in left that are not in right.
 *
 * Example:
 *
 * ```ts
 * difference([1,2,3], [2,3]) // => [1]
 * difference([2,3], [2,3]) // => []
 * difference([2], [3]) // => [2]
 * ```
 */
export function difference<T>(left: T[], right: T[]): Set<T> {
    const rightSet = new Set(right)

    const result: Set<T> = new Set<T>()
    for (const item of left) {
        if (!rightSet.has(item)) {
            result.add(item)
        }
    }
    return result
}

export function differenceBy<T, K, ID>(left: T[], leftIdFunc: (val: T) => ID, right: K[], rightIdFunc: (val: K) => ID) {
    const leftIds = left.map(leftIdFunc)
    const rightIds = right.map(rightIdFunc)

    const diff = difference(leftIds, rightIds)

    return left.filter(item => diff.has(leftIdFunc(item)))
}

export function partitionBy<T>(items: T[], predicate: (item: T) => boolean): [T[], T[]] {
    const whenTrue = []
    const whenFalse = []
    for (const item of items) {
        if (predicate(item)) {
            whenTrue.push(item)
        } else {
            whenFalse.push(item)
        }
    }
    return [whenTrue, whenFalse]
}
