#!/usr/bin/env node
import commandLineArgs, { OptionDefinition } from "command-line-args"
import fse from "fs-extra"
import path from "path"
import { compile } from "./compile"

const argumentDefinitions: (OptionDefinition & { name: keyof CLIArguments })[] = [
    { name: "packageName", type: String },
    { name: "tsconfig", type: String },
    { name: "index", type: String },
    { name: "out", type: String, defaultValue: "./code" },
    { name: "force", type: Boolean, defaultValue: false },
    { name: "help", type: Boolean, defaultValue: false },
]

export interface CLIArguments {
    index?: string
    tsconfig?: string
    packageName?: string
    out?: string
    force?: boolean
    help?: boolean
}

function printUsage() {
    const usage = `Usage:

    component-importer [--packageName] [--index] [--tsconfig] [--out] [--force]

Where:

    [index]       : (required) a path to the index (starting point) of the source code (usually under src/index.ts)
    [tsconfig]    : (required) a path to the tsconfig (optional)
    [packageName] : (required) the package name to import e.g. @material-ui/core
    [out]         : (optional) the output directory.
                    Defaults to "./code".
    [force]       : (optional) re-writes component files, even if they already exist.
                    Defaults to false.

Example:

    component-importer --packageName @material-ui/core --index "path/to/material-ui/src/index.tsx" --tsconfig "path/to/material-ui/tsconfig.json" --out "path/to/material-ui/src/index.tsx"

`

    console.log(usage)
}

async function main() {
    const args = commandLineArgs(argumentDefinitions) as CLIArguments
    console.log("Arguments:", args)

    if (args.help || !args.index || !args.packageName || !args.out) {
        printUsage()
        return
    }

    const outFiles = await compile({
        rootFiles: [args.index],
        packageName: args.packageName,
        tsConfigPath: args.tsconfig,
    })

    for (const outFile of outFiles) {
        const resultingFilePath = path.join(args.out, outFile.fileName)
        const resultingDirectory = path.dirname(resultingFilePath)

        if (outFile.type === "component" && fse.existsSync(resultingFilePath) && !args.force) {
            console.log("Skipping existing file ......", resultingFilePath)
        } else {
            console.log("Generating ..................", resultingFilePath)
            fse.ensureDirSync(resultingDirectory)
            fse.writeFileSync(resultingFilePath, outFile.outputSource)
        }
    }
}
main()
