import glob from "glob"
import path from "path"
import * as ts from "typescript"
import { classComponentFinder } from "./ts/classComponentFinder"
import { exportStarFinder } from "./ts/exportStarFinder"
import { exportDeclarationFinder } from "./ts/exportDeclarationFinder"
import { functionDeclarationFinder } from "./ts/functionDeclarationFinder"
import { referenceComponentFinder } from "./ts/referenceComponentFinder"
import { ComponentFinder, ResultType } from "./ts/types"
import { variableStatementFinder } from "./ts/variableStatementFinder"
import { ComponentInfo, ProcessedFile } from "./types"
import { flatMap } from "./utils"
import { aliasedSymbolFinder } from "./ts/aliasedSymbolFinder"

export async function analyzeTypeScript(files: string[], tsConfigPath?: string): Promise<ProcessedFile[]> {
    const processed: ProcessedFile[] = files.map(t => ({
        components: [],
        srcFile: t,
    }))

    const defaultConfig: ts.CompilerOptions = {
        //rootDir: dir,
        target: ts.ScriptTarget.ESNext,
        allowSyntheticDefaultImports: true,
        jsx: ts.JsxEmit.Preserve,
        typeRoots: [],
    }

    const patterns = files.map(file => {
        const dir = path.dirname(file)
        return path.join(dir, "**/*.{tsx,ts,jsx,d.ts}")
    })
    const rootNames = flatMap(patterns, pattern => glob.sync(pattern))

    const config = tsConfigPath ? parseTsConfig(tsConfigPath) : defaultConfig

    console.log("creating program")
    const program = ts.createProgram({ rootNames, options: config })

    if (process.env.NODE_ENV !== "test") {
        program
            .getSemanticDiagnostics()
            .forEach(diag =>
                console.warn(
                    diag.file.fileName,
                    ts.getLineAndCharacterOfPosition(diag.file, diag.start),
                    ts.flattenDiagnosticMessageText(diag.messageText, "\n"),
                ),
            )
    }

    console.log("Source Files Founds:", program.getSourceFiles().length)
    program.getTypeChecker() // to make sure the parent nodes are set
    for (const file of processed) {
        const sourceFile = program.getSourceFile(file.srcFile)
        if (!sourceFile) throw new Error(`File ${file.srcFile} not found.`)
        console.log("SOURCE FILE", sourceFile.fileName)
        await analyze(sourceFile, file, program)
    }
    return processed
}

function analyze(sourceFile: ts.SourceFile, processedFile: ProcessedFile, program: ts.Program) {
    processedFile.components = Array.from(findComponents(sourceFile, program))
}

function* findComponents(sourceFile: ts.SourceFile, program: ts.Program): IterableIterator<ComponentInfo> {
    const componentFinders: ComponentFinder[] = [
        aliasedSymbolFinder,
        classComponentFinder,
        exportDeclarationFinder,
        exportStarFinder,
        functionDeclarationFinder,
        referenceComponentFinder,
        variableStatementFinder,
    ]

    const remainingStatements = Array.from(sourceFile.statements)

    for (const node of remainingStatements) {
        for (const componentFinder of componentFinders) {
            for (const comp of componentFinder.extract(node, program)) {
                if (comp.type === ResultType.ComponentInfo) {
                    yield comp.componentInfo
                }
                if (comp.type === ResultType.SourceFile) {
                    remainingStatements.push(...comp.sourceFile.statements)
                }
            }
        }
    }
}

function parseTsConfig(tsConfigPath: string): ts.CompilerOptions {
    const originalWorkingDirectory = process.cwd()
    try {
        process.chdir(path.dirname(tsConfigPath))

        const parseConfigHost: ts.ParseConfigHost = {
            fileExists: ts.sys.fileExists,
            readFile: ts.sys.readFile,
            readDirectory: ts.sys.readDirectory,
            useCaseSensitiveFileNames: true,
        }

        const configFileName = ts.findConfigFile(path.dirname(tsConfigPath), ts.sys.fileExists, "tsconfig.json")

        const configFile = ts.readConfigFile(configFileName, ts.sys.readFile)
        const parsedConfigFile = ts.parseJsonConfigFileContent(configFile.config, parseConfigHost, "./")

        if (parsedConfigFile.errors.length > 0) {
            for (const diagnostic of parsedConfigFile.errors) {
                console.warn(ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n"))
            }
            process.exit(1)
        }

        return parsedConfigFile.options
    } finally {
        process.chdir(originalWorkingDirectory)
    }
}
