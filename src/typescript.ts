import glob from "glob"
import path from "path"
import * as ts from "typescript"
import { findComponents } from "./findComponents"
import { ComponentInfo } from "./types"
import { flatMap } from "./utils"

export interface ProcessedFile {
    srcFile: string
    components: ComponentInfo[]
}

/**
 * Analyzes a TypeScript source code and returns an array of processed files with the components that were found in the process.
 *
 * @param files the "root" files to analize. Usually just pointing to the src/index.ts, src/index.tsx, src/index.d.ts is enough.
 * @param tsConfigPath the path to a tsconfig. If not present, a default tsconfig will be used instead.
 */
export async function analyzeTypeScript(files: string[], tsConfigPath?: string): Promise<ComponentInfo[]> {
    const processed: ProcessedFile[] = files.map(t => ({
        components: [],
        srcFile: t,
    }))

    const patterns = files.map(file => {
        const dir = path.dirname(file)
        return path.join(dir, "**/*.{tsx,ts,jsx,d.ts,js}")
    })
    const rootNames = flatMap(patterns, pattern => glob.sync(pattern))

    const program = createProgram({ rootNames, tsConfigPath })

    if (process.env.NODE_ENV !== "test") {
        program.getSemanticDiagnostics().forEach(diag => {
            if (!diag.file) {
                return
            }
            console.warn(
                diag.file.fileName,
                ts.getLineAndCharacterOfPosition(diag.file, diag.start!),
                ts.flattenDiagnosticMessageText(diag.messageText, "\n"),
            )
        })
    }

    program.getTypeChecker() // to make sure the parent nodes are set
    for (const file of processed) {
        const sourceFile = program.getSourceFile(file.srcFile)
        if (!sourceFile)
            throw new Error(
                `File ${
                    file.srcFile
                } not found. If you're importing an NPM package, make sure the package has been installed by running yarn add <package name>, alternatively make sure you've ran yarn install.`,
            )
        await analyze(sourceFile, file, program)
    }

    return flatMap(processed, p => p.components)
}

function analyze(sourceFile: ts.SourceFile, processedFile: ProcessedFile, program: ts.Program) {
    processedFile.components = Array.from(findComponents(sourceFile, program)).filter(comp => comp.name.match(/^[A-Z]/))
}

export function parseTsConfig(tsConfigPath: string): ts.CompilerOptions {
    const parseConfigHost: ts.ParseConfigHost = {
        fileExists: ts.sys.fileExists,
        readFile: ts.sys.readFile,
        readDirectory: ts.sys.readDirectory,
        useCaseSensitiveFileNames: true,
    }

    const configFileName = ts.findConfigFile(path.dirname(tsConfigPath), ts.sys.fileExists, "tsconfig.json")

    const configFile = ts.readConfigFile(configFileName, ts.sys.readFile)
    const parsedConfigFile = ts.parseJsonConfigFileContent(
        configFile.config,
        parseConfigHost,
        path.dirname(tsConfigPath),
    )

    if (parsedConfigFile.errors.length > 0) {
        for (const diagnostic of parsedConfigFile.errors) {
            console.error(ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n"))
        }
    }

    return { ...parsedConfigFile.options, removeComments: false }
}

export function createFramerXProgram(projectRoot: string): ts.Program {
    const tsConfigPath = path.join(projectRoot, "tsconfig.json")
    const options = parseTsConfig(tsConfigPath)
    const components = glob.sync(path.join(projectRoot, "code/**/*.tsx"))

    return ts.createProgram({
        rootNames: components,
        options,
    })
}

export function createProgram({ tsConfigPath, rootNames }: { tsConfigPath?: string; rootNames: string[] }) {
    const defaultConfig: ts.CompilerOptions = {
        target: ts.ScriptTarget.ESNext,
        allowSyntheticDefaultImports: true,
        jsx: ts.JsxEmit.Preserve,
        noEmit: true,
        allowJs: true,
        moduleResolution: ts.ModuleResolutionKind.NodeJs,
    }

    const config = tsConfigPath ? parseTsConfig(tsConfigPath) : defaultConfig

    return ts.createProgram({ rootNames, options: config })
}
