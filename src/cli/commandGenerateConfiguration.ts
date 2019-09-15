import commandLineArgs, { OptionDefinition } from "command-line-args"
import { existsSync, readFileSync, writeFileSync } from "fs"
import * as path from "path"
import { emitConfiguration } from "../generate"
import { analyzeTypeScript } from "../typescript"
import { generateComponents } from "./commandGenerateComponents"

type CliGenerateConfigurationArguments = {
    importPath?: string
    index?: string[]
    tsconfig?: string
    help?: boolean
    force: boolean
    out: string
}

function findDefaultIndex(importPath: string): string[] {
    const root = path.join("node_modules", importPath)
    const packageJsonPath = path.join(root, "package.json")
    if (!existsSync(packageJsonPath)) {
        return []
    }

    const packageJson = JSON.parse(readFileSync(packageJsonPath).toString())

    // According to https://www.typescriptlang.org/docs/handbook/declaration-files/publishing.html
    // type definitions live either at:
    //
    // - package.json:types
    // - package.json:typings
    // - /index.d.ts
    const localPathToTypes = packageJson.typings || packageJson.types || "index.d.ts"

    return [path.join(root, localPathToTypes)]
}

function printUsage() {
    console.log(`# Initialization Command

Description:
    Creates the importer.config.json configuration file.

Usage:

    component-importer init [--importPath] [--index] [--tsconfig] [--help] [--force]

Where:

    [importPath]   : If you're importing from node_modules, use the package name. E.g. @material-ui/core.
                     If you're importing from a relative path, then use the path to the component you want to import. E.g. path/to/my-design-system/src/index.tsx.
    [index]        : (optional) A path to the the index.tsx, index.d.ts or index.ts of your application.
                     If not passed, will try to infer it based on the package.json's types or typings key.
    [out]          : (optional) The location where the importer.config.json will be written to. Defaults to ./importer.config.json.
    [tsconfig]     : (optional) A path to the tsconfig.json.
    [help]         : (optional) Prints this message.
    [force]        : (optional) Will override the existing components.

`)
    process.exit(1)
}

function printInvalidIndex() {
    console.error(`❗️Unable to find type definitions. Did you forget to add the --index parameter?

Type component-importer init --help for more information.
`)
    process.exit(1)
}

function printNoComponentsFound(index: string[]) {
    console.error(`❗️We tried to look for components in the following locations ${index.join(
        ", ",
    )}, but didn't find any. This usually means a few things:

    1. You pointed the component to a file (or files) file that don't export any typescript components. Make sure you are pointing the --index correctly.
    2. The type definitions are too complex or not supported by the component-importer

    Type component-importer init --help for more information.
    `)
    process.exit(1)
}

export async function commandGenerateConfiguration(argv: string[]) {
    const argumentDefinitions: (OptionDefinition & { name: keyof CliGenerateConfigurationArguments })[] = [
        { name: "importPath", type: String, defaultOption: true },
        { name: "index", type: String, multiple: true },
        { name: "out", type: String, defaultValue: "./" },
        { name: "tsconfig", type: String },
        { name: "help", type: Boolean, defaultValue: false },
        { name: "force", type: Boolean, defaultValue: false },
    ]

    const args = commandLineArgs(argumentDefinitions, { argv }) as CliGenerateConfigurationArguments

    if (args.help || !args.importPath || !args.out) {
        printUsage()
        return
    }

    const { tsconfig, importPath, index = findDefaultIndex(importPath) } = args

    if (!index || index.length == 0) {
        printInvalidIndex()
    }

    const components = await analyzeTypeScript(index, tsconfig)

    const result = emitConfiguration({
        components,
        packageName: importPath,
        rootFiles: index,
        tsconfigPath: tsconfig,
    })

    if (Object.keys(result.configuration.components).length === 0) {
        printNoComponentsFound(index)
    }

    const configFileLocation = path.join(args.out, "importer.config.json")

    if (!existsSync(configFileLocation) || args.force) {
        console.log("✅ Generating ", path.resolve(configFileLocation))
        writeFileSync(configFileLocation, result.outputSource)

        generateComponents({
            config: configFileLocation,
        })
    } else {
        console.warn(`⚠️ Skipping generation because file already exists: ${configFileLocation}.`)
    }
}
