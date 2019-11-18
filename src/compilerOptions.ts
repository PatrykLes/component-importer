import fs from "fs"
import path from "path"
import { CompileOptions, ComponentConfiguration } from "./types"
import { ensureExtension } from "./utils"

type Validator = (compilerOptions: any) => { valid: true } | { valid: false; message: string }

/**
 * @returns a validator that checks that the value options[key] matches the given predicate. If the value does not match the predicate, an error is returned.
 */
const keyValidator = (key: string, predicate: (x: any, options: any) => boolean, message: string): Validator => {
    return (options: any) => {
        const value = options[key]
        if (!predicate(value, options)) {
            return { valid: false, message }
        }
        return { valid: true }
    }
}

const validators = [
    keyValidator(
        "mode",
        t => t === undefined || ["typescript", "flow", "plain"].includes(t),
        "Expected 'mode' to be either 'typescript', 'flow' or 'plain'",
    ),
    keyValidator("packageName", t => typeof t === "string", "Expected 'packageName' to be a string"),
    keyValidator(
        "rootFiles",
        (t, options) => {
            if (options.mode === "typescript" || options.mode === undefined) {
                return Array.isArray(t) && t.length > 0
            } else {
                return t === undefined
            }
        },
        "Expected 'rootFiles' to be a non-empty array if the mode is 'typescript', otherwise it should be undefined",
    ),
    keyValidator("additionalImports", t => Array.isArray(t), "Expected 'additionalImports' to be an array of strings"),
    keyValidator("components", t => t && Object.keys(t).length > 0, "Expected 'components' to be an object."),
    keyValidator("out", t => typeof t === "string", "Expected 'out' to be a string"),
    keyValidator("prettierrc", t => t === undefined || typeof t === "string", "Expected 'prettierrc' to be a string"),
]

/**
 * Verifies that the given `options` matches the structure of the CompileOptions. Returns a list of human-friendly error messages if validation fails.
 */
export function verifyOptions(
    options: any,
): { valid: true; result: CompileOptions } | { valid: false; errors: string[] } {
    const errors = []

    for (const isValid of validators) {
        const validationRes = isValid(options)

        if (validationRes.valid === false) {
            errors.push(validationRes.message)
        }
    }

    return errors.length === 0 ? { valid: true, result: options } : { valid: false, errors }
}

export function parseOptions(configPath: string): CompileOptions {
    if (!fs.existsSync(configPath)) {
        throw new Error(`Unable to find importer.config.json at ${path.resolve(configPath)}.`)
    }

    const unverifiedOptions = JSON.parse(fs.readFileSync(configPath).toString())

    const verificationResult = verifyOptions(unverifiedOptions)

    if (verificationResult.valid === false) {
        throw new Error(`Invalid configuration at ${configPath}. Error(s):\n\n${verificationResult.errors.join("\n")}`)
    }

    return { ...verificationResult.result, projectRoot: path.dirname(configPath) }
}

const defaultComponentConfig: ComponentConfiguration = {
    ignore: false,
    ignoredProps: [],
}

function getComponentConfig(opts: CompileOptions, componentName: string): ComponentConfiguration {
    return (opts.components || {})[componentName] || defaultComponentConfig
}

/**
 * @returns true if the given property in the given component should be ignored for compilation.
 */
export function isPropIgnored(opts: CompileOptions, componentName: string, propName: string): boolean {
    const ignoredProps = getComponentConfig(opts, componentName).ignoredProps || []

    return ignoredProps.includes(propName)
}

/**
 * @returns true if the given component should be ignored from compilation.
 */
export function isComponentIgnored(opts: CompileOptions, componentName: string): boolean {
    return getComponentConfig(opts, componentName).ignore
}

/**
 * @returns the path where the given component will be compiled to.
 */
export function getEmitPath(opts: CompileOptions, componentName: string): string {
    const resultingPath = getComponentConfig(opts, componentName).path || path.join(opts.out, componentName)

    return ensureExtension(resultingPath, "tsx")
}
