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

function generateFile(file: string, source: string, force: boolean) {
    if (!fse.existsSync(file)) {
        console.log("✅ Generating .....................", file)
        fse.ensureDirSync(path.dirname(file))
        fse.writeFileSync(file, source)
    }
    if (fse.existsSync(file) && force) {
        console.log("⚠️  Rewriting file (--force)........", file)
        fse.ensureDirSync(path.dirname(file))
        fse.writeFileSync(file, source)
    } else {
        console.log("⚠️  Skipping existing file .........", file)
    }
}

export async function generateComponents(args: CliGenerateComponentsArguments) {
    if (args.help || !args.config) {
        printUsage()
        return
    }

    const config = parseOptions(args.config)
    const outFiles = await compile(config)

    for (const outFile of outFiles) {
        if (outFile.type === "component") {
            generateFile(outFile.emitPath, outFile.outputSource, !!args.force)
        } else if (outFile.type === "hoc") {
            const resultingFilePath = path.join(config.out, outFile.fileName)
            generateFile(resultingFilePath, outFile.outputSource, !!args.force)
        } else {
            console.warn(
                [
                    `🐛 Unrecognized EmitResult type ${outFile.type}. `,
                    `This likely means that that a new EmitResult `,
                    `type was introduced but hasn't been correctly configured. `,
                ].join(""),
            )
        }
    }
}

export async function commandGenerateComponents(argv: string[]) {
    const argumentDefinitions: (OptionDefinition & { name: keyof CliGenerateComponentsArguments })[] = [
        { name: "config", type: String, defaultValue: "importer.config.json" },
        { name: "force", type: Boolean, defaultValue: false },
        { name: "help", type: Boolean, defaultValue: false },
    ]

    const args = commandLineArgs(argumentDefinitions, { argv }) as CliGenerateComponentsArguments

    generateComponents(args)
}
