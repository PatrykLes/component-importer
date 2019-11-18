import path from "path"
import fs from "fs"
import commandLineArgs, { OptionDefinition } from "command-line-args"
import { emitConfiguration } from "../generate"
import { analyzeTypeScript, analyzeFlow, analyzePlainJavaScript } from "../analyze"
import { generateComponents } from "./commandGenerateComponents"
import { ComponentInfo, EmitResult } from "../types"
import {
    findDefaultIndex,
    findFilesAtImportPath,
    defaultPlainIgnorePatterns,
    defaultPlainIncludePattern,
    defaultFlowIgnorePatterns,
    defaultFlowIncludePattern,
} from "../utils"

type CliGenerateConfigurationArguments = {
    importPath?: string
    mode?: "typescript" | "plain" | "flow"
    ignore?: string[]
    include?: string
    index?: string[]
    tsconfig?: string
    help?: boolean
    force: boolean
    out: string
    verbose?: boolean
}

function printUsage() {
    console.log(`# Initialization Command

Description:
    Creates the importer.config.json configuration and generates code components.

Usage:

    component-importer init <importPath> [--mode] [--ignore] [--include] [--index] [--tsconfig] [--help] [--force] [--verbose]

Examples:

    # To import the https://material-ui.com/ library run:
    component-importer init material @material-ui/core

    # To import https://baseweb.design/getting-started/setup/
    component-importer init baseui

    # To import from source
    component-importer init "../../relative/path" --index path/to/index.tsx --tsconfig path/to/tsconfig.json

Where:

    <importPath>   : If you're importing from node_modules, use the package name. E.g. @material-ui/core.
                     If you're importing from a relative path, then use the path to the component you want to import. E.g. path/to/my-design-system/src/index.tsx.
    [mode]         : (optional) The mode to operate in, depending on the flavor of JavaScript used in your codebase. Can be one of: "typescript", "flow", or "plain" for vanilla JavaScript / propTypes support.
                     Default: "typescript".
    [ignore]       : (optional) One or more glob patterns of files to ignore when running in "plain" or "flow" mode.
                     Default: "${defaultPlainIgnorePatterns.map(p => `"${p}"`).join(" ")}".
    [include]      : (optional) Glob pattern for files to include when in "plain" or "flow" mode.
                     Default: "${defaultPlainIncludePattern}". 
    [index]        : (optional) A path to the the "index.tsx", "index.d.ts" or "index.ts" of your application. Valid only in "typescript" mode.
                     If not passed, will try to infer it based on the package.json's "types" or "typings" key.
    [out]          : (optional) The location where the importer.config.json will be written to.
                     Default: "./importer.config.json".
    [tsconfig]     : (optional) A path to the "tsconfig.json" when in "typescript" mode.
    [help]         : (optional) Prints this message.
    [force]        : (optional) Will overwrite the existing components and configuration.
                     Default: false.
    [verbose]      : (optional) Increase verbosity of printed out messages.
                     Default: false.

`)
    process.exit(1)
}

function printInvalidIndex() {
    console.error(`❗️Unable to find type definitions. Did you forget to add the --index parameter?

Type component-importer init --help for more information.
`)
    process.exit(1)
}

function printNoComponentsFound(mode: string, locations: string[]) {
    console.error(`❗️We looked for components in the following locations ${locations.join(
        ", ",
    )}, but didn't find any. This usually means a few things:

    1. You pointed the component importer to a file or directory that doesn't export any components. ${
        mode === "typescript" ? "Make sure you've set the --index correctly." : ""
    }
    2. The type definitions are too complex or not supported by the component-importer.

    Type component-importer init --help for more information.
    `)
    process.exit(1)
}

function printInvalidMode(mode: string) {
    console.error(`❗️The mode "${mode}" isn't valid. Try one of "typescript", "plain", or "flow".

    Type component-importer init --help for more information.
    `)
    process.exit(1)
}

export async function commandGenerateConfiguration(argv: string[]) {
    const argumentDefinitions: (OptionDefinition & { name: keyof CliGenerateConfigurationArguments })[] = [
        { name: "importPath", type: String, defaultOption: true },
        { name: "mode", type: String, defaultValue: "typescript" },
        {
            name: "ignore",
            type: String,
            multiple: true,
        },
        { name: "include", type: String },
        { name: "index", type: String, multiple: true },
        { name: "out", type: String, defaultValue: "./" },
        { name: "tsconfig", type: String },
        { name: "help", type: Boolean, defaultValue: false },
        { name: "force", type: Boolean, defaultValue: false },
        { name: "verbose", type: Boolean, defaultValue: false },
    ]

    const args = commandLineArgs(argumentDefinitions, { argv }) as CliGenerateConfigurationArguments

    if (args.help || !args.importPath || !args.out) {
        printUsage()
        return
    }

    if (!["typescript", "plain", "flow"].includes(args.mode)) {
        printInvalidMode(args.mode)
        return
    }

    let components: ComponentInfo[]
    let result: EmitResult

    if (args.mode === "typescript") {
        const { tsconfig, importPath, index = findDefaultIndex(importPath) } = args

        if (!index || index.length == 0) {
            printInvalidIndex()
        }

        components = await analyzeTypeScript(index, tsconfig)

        result = emitConfiguration({
            mode: "typescript",
            components,
            packageName: importPath,
            rootFiles: index,
            tsconfigPath: tsconfig,
        })

        if (Object.keys(result.configuration.components).length === 0) {
            printNoComponentsFound("typescript", index)
        }
    }

    if (args.mode === "flow") {
        const { importPath, ignore = defaultFlowIgnorePatterns, include = defaultFlowIncludePattern, verbose } = args
        const files = findFilesAtImportPath(importPath, include, ignore)

        components = await analyzeFlow(files, { verbose })

        result = emitConfiguration({
            mode: "flow",
            components,
            packageName: importPath,
            ignore,
            include,
        })

        if (Object.keys(result.configuration.components).length === 0) {
            printNoComponentsFound("flow", [importPath])
        }
    }

    if (args.mode === "plain") {
        const { importPath, ignore = defaultPlainIgnorePatterns, include = defaultPlainIncludePattern, verbose } = args
        const files = findFilesAtImportPath(importPath, include, ignore)

        components = await analyzePlainJavaScript(files, { verbose })

        result = emitConfiguration({
            mode: "plain",
            components,
            packageName: importPath,
            ignore,
            include,
        })

        if (Object.keys(result.configuration.components).length === 0) {
            printNoComponentsFound("plain", [importPath])
        }
    }

    const configFileLocation = path.join(args.out, "importer.config.json")

    if (!fs.existsSync(configFileLocation) || args.force) {
        console.log("✅ Generating ", path.resolve(configFileLocation))
        fs.writeFileSync(configFileLocation, result.outputSource)

        generateComponents({
            config: configFileLocation,
        })
    } else {
        console.warn(`⚠️ Skipping generation because file already exists: ${configFileLocation}.`)
    }
}
