import { OptionDefinition } from "command-line-args"
import commandLineArgs from "command-line-args"
import { flatMap } from "../utils"
import { analyzeTypeScript } from "../typescript"
import { emitConfiguration } from "../generate"
import { existsSync, writeFileSync } from "fs"
import * as path from "path"

type CliGenerateConfigurationArguments = {
    importPath?: string
    index?: string[]
    tsconfig?: string
    help?: boolean
    force: boolean
    out: string
}

function printUsage() {
    console.log(`# Initialization Command

Description:
    Creates the importer.config.json configuration file.

Usage:

    component-importer init [--index] [--tsconfig] [--importPath] [--help]

Where:

    [index]        : a path to the the index.tsx, index.d.ts or index.ts of your application.
    [importPath]   : If you're importing from node_modules, use the package name. E.g. @material-ui/core.
                     If you're importing from a relative path, then use the path to the component you want to import. E.g. path/to/my-design-system/src/index.tsx.
    [out]          : (optional) The location where the importer.config.json will be written to. Defaults to ./importer.config.json.
    [tsconfig]     : (optional) A path to the tsconfig.json.
    [help]         : (optional) Prints this message.

`)
}

export async function commandGenerateConfiguration(argv: string[]) {
    const argumentDefinitions: (OptionDefinition & { name: keyof CliGenerateConfigurationArguments })[] = [
        { name: "index", type: String, multiple: true },
        { name: "tsconfig", type: String },
        { name: "importPath", type: String },
        { name: "help", type: Boolean, defaultValue: false },
        { name: "force", type: Boolean, defaultValue: false },
        { name: "out", type: String, defaultValue: "./" },
    ]

    const args = commandLineArgs(argumentDefinitions, { argv }) as CliGenerateConfigurationArguments

    if (args.help || !args.index || !args.importPath || !args.out) {
        printUsage()
        return
    }

    const { index, tsconfig, importPath } = args

    const processedFiles = await analyzeTypeScript(index, tsconfig)

    const components = flatMap(processedFiles, comp => comp.components)

    const result = emitConfiguration({
        components,
        packageName: importPath,
        rootFiles: index,
        tsconfigPath: tsconfig,
    })

    const configFileLocation = path.join(args.out, "importer.config.json")

    if (!existsSync(configFileLocation) || args.force) {
        console.log("Generating ", path.resolve(configFileLocation))
        writeFileSync(configFileLocation, result.outputSource)
    } else {
        console.warn(`Skipping generation because file already exists: ${configFileLocation}`)
    }
}
