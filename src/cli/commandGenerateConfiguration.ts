import { OptionDefinition } from "command-line-args"
import commandLineArgs from "command-line-args"
import { flatMap } from "../utils"
import { analyzeTypeScript } from "../typescript"
import { emitConfiguration } from "../generate"
import { existsSync, writeFileSync } from "fs"
import * as path from "path"

type CliGenerateConfigurationArguments = {
    importPath?: string
    files?: string[]
    tsconfig?: string
    help?: boolean
    out: string
}

function printUsage() {
    console.log(`Usage:

    component-importer init [--files] [--tsconfig] [--importPath] [--help]

`)
}

export async function commandGenerateConfiguration(argv: string[]) {
    const argumentDefinitions: (OptionDefinition & { name: keyof CliGenerateConfigurationArguments })[] = [
        { name: "files", type: String, multiple: true },
        { name: "tsconfig", type: String },
        { name: "importPath", type: String },
        { name: "help", type: Boolean, defaultValue: false },
        { name: "out", type: String, defaultValue: "importer.config.json" },
    ]

    const args = commandLineArgs(argumentDefinitions, { argv }) as CliGenerateConfigurationArguments

    if (args.help || !args.files || !args.importPath || !args.out) {
        printUsage()
        return
    }

    const { files, tsconfig, importPath } = args

    const processedFiles = await analyzeTypeScript(files, tsconfig)

    const components = flatMap(processedFiles, comp => comp.components)

    const result = emitConfiguration({
        components,
        packageName: importPath,
        rootFiles: files,
        tsconfigPath: tsconfig,
    })

    if (!existsSync(args.out)) {
        console.log("Generating ", path.resolve(args.out))
        writeFileSync(args.out, result.outputSource)
    } else {
        console.warn(`Skipping generation because file already exists: ${args.out}`)
    }
}
