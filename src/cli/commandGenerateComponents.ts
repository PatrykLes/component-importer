import commandLineArgs, { OptionDefinition } from "command-line-args"
import fse from "fs-extra"
import path from "path"
import { compile } from "../compile"
import { parseOptions } from "../compilerOptions"

type CliGenerateComponentsArguments = {
    config?: string
    force?: boolean
    help?: boolean
}

function printUsage() {
    const usage = `Usage:

    component-importer generate --config path/to/importer.config.json

Where:
    [force]       : (optional) re-writes component files, even if they already exist.
                    Defaults to false.

Example:

    component-importer --packageName @material-ui/core --index "path/to/material-ui/src/index.tsx" --tsconfig "path/to/material-ui/tsconfig.json" --out "path/to/material-ui/src/index.tsx"

`

    console.log(usage)
}

export async function commandGenerateComponents(argv: string[]) {
    const argumentDefinitions: (OptionDefinition & { name: keyof CliGenerateComponentsArguments })[] = [
        { name: "config", type: String, defaultValue: "importer.config.json" },
        { name: "force", type: Boolean, defaultValue: false },
        { name: "help", type: Boolean, defaultValue: false },
    ]

    const args = commandLineArgs(argumentDefinitions, { argv }) as CliGenerateComponentsArguments

    if (args.help || !args.config) {
        printUsage()
        return
    }

    const config = parseOptions(args.config)
    const outFiles = await compile(config)

    for (const outFile of outFiles) {
        const resultingFilePath = path.join(config.out, outFile.fileName)
        const resultingDirectory = path.dirname(resultingFilePath)

        if (outFile.type === "component" && fse.existsSync(resultingFilePath) && !args.force) {
            console.log("Skipping existing file ......", resultingFilePath)
        } else if (outFile.type === "hoc" && fse.existsSync(resultingFilePath)) {
            console.log("Skipping existing file ......", resultingFilePath)
        } else {
            console.log("Generating ..................", resultingFilePath)
            fse.ensureDirSync(resultingDirectory)
            fse.writeFileSync(resultingFilePath, outFile.outputSource)
        }
    }
}
