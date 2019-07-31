import fs from "fs"
import path from "path"
import { CompileOptions } from "./types"

type Validator = (compilerOptions: any) => { valid: true } | { valid: false; message: string }

const keyValidator = (key: string, predicate: (x: any) => boolean, message: string): Validator => {
    return (options: any) => {
        const value = options[key]
        if (!value) {
            return {
                valid: false,
                message: `Missing key ${key}`,
            }
        }
        if (!predicate(value)) {
            return { valid: false, message }
        }
        return { valid: true }
    }
}

const validators = [
    keyValidator("packageName", t => typeof t === "string", "Expected 'packageName' to be a string"),
    keyValidator("rootFiles", t => Array.isArray(t) && t.length > 0, "Expected 'rootFiles' to be a non empty array"),
    keyValidator("additionalImports", t => Array.isArray(t), "Expected 'additionalImports' to be an array of strings"),
    keyValidator("components", t => t && Object.keys(t).length > 0, "Expected 'components' to be a non object."),
    keyValidator("out", t => typeof t === "string", "Expected 'out' to be a string"),
]

export function parseOptions(configPath: string): CompileOptions {
    if (!fs.existsSync(configPath)) {
        throw new Error(`Unable to find importer.config.json at ${path.resolve(configPath)}.`)
    }

    const result = JSON.parse(fs.readFileSync(configPath).toString())

    for (const isValid of validators) {
        const validationRes = isValid(result)

        if (validationRes.valid === false) {
            throw new Error(`Invalid Configuration at ${configPath}:\n\n${validationRes.message}`)
        }
    }

    return result
}
