import * as ts from "typescript"
import { ComponentInfo, ProcessedFile } from "./types"
import { ComponentFinder } from "./ts/types"
import { classComponentFinder } from "./ts/classComponentFinder"
import { functionComponentFinder } from "./ts/functionComponentFinder"
import { referenceComponentFinder } from "./ts/referenceComponentFinder"
import { exportTypeFinder } from "./ts/exportTypeFinder"
import { exportStarFinder } from "./ts/exportStarFinder"

export async function analyzeTypeScript(files: string[], tsConfigPath?: string): Promise<ProcessedFile[]> {
    const processed: ProcessedFile[] = files.map(t => ({
        components: [],
        srcFile: t,
    }))

    const defaultConfig: ts.CompilerOptions = {
        //rootDir: dir,
        target: ts.ScriptTarget.ESNext,
        jsx: ts.JsxEmit.React,
        typeRoots: [],
    }

    const program = ts.createProgram({
        options: tsConfigPath ? parseTsConfig(tsConfigPath) : defaultConfig,
        rootNames: processed.map(t => t.srcFile),
    })

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
        classComponentFinder,
        functionComponentFinder,
        referenceComponentFinder,
        exportTypeFinder,
    ]

    for (const node of sourceFile.statements) {
        for (const componentFinder of componentFinders) {
            for (const comp of componentFinder.extract(node, program)) {
                yield comp
            }
        }
    }
}

function parseTsConfig(tsConfigPath: string): ts.CompilerOptions {
    const { error, config } = ts.readConfigFile(tsConfigPath, ts.sys.readFile)
    if (error) {
        throw new Error(`Unable to find tsconfig.json under ${tsConfigPath}`)
    }
    return config
}
