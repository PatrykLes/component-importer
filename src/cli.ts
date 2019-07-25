import commandLineArgs, { OptionDefinition } from "command-line-args"
import fse from "fs-extra"
import path from "path"
import { compile } from "./compile"

const argumentDefinitions: (OptionDefinition & { name: keyof CLIArguments })[] = [
    { name: "packageName", type: String },
    { name: "tsconfig", type: String },
    { name: "index", type: String },
    { name: "out", type: String },
]

export interface CLIArguments {
    index?: string
    tsconfig?: string
    packageName?: string
    out?: string
}

function printUsage() {
    const lines = [
        "Usage:",
        "",
        "    cli [packageName] [index] [tsconfig] [out-dir] ",
        "",
        "Where:",
        "",
        "    [index]: a path to the index (starting point) of the source code (usually under src/index.ts)",
        "    [tsconfig]: a path to the tsconfig (optional)",
        "    [packageName]: the package name to import e.g. @material-ui/core",
        "    [out]: the output directory",
    ]
    lines.forEach(line => console.log(line))
}

async function main() {
    const args = commandLineArgs(argumentDefinitions) as CLIArguments
    console.log(args)

    if (!args.index || !args.packageName || !args.out) {
        printUsage()
        return
    }

    const outFiles = await compile({
        rootFiles: [args.index],
        packageName: args.packageName,
        tsConfigPath: args.tsconfig,
    })

    for (const outFile of outFiles) {
        const file = path.join(args.out, outFile.fileName)
        const dir = path.dirname(file)
        console.log("Generating ", file)
        fse.ensureDirSync(dir)
        fse.writeFileSync(file, outFile.outputSource)
    }
}
main()
