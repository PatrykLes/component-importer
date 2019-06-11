import commandLineArgs, { OptionDefinition } from "command-line-args"
import fse from "fs-extra"
import path from "path"
import { analyze, changeExtension, convert, generate, globAsync, makePrettier } from "./index"

const argumentDefinitions: (OptionDefinition & { name: keyof CLIArguments })[] = [
    { name: "dirs", type: String, defaultOption: true, multiple: true },
    { name: "pattern", type: String },
    { name: "lang", type: String },
]

let args: CLIArguments
export interface CLIArguments {
    dirs?: string[]
    pattern?: string
    lang?: "typescript" | "flow"
}

async function main() {
    console.log(process.argv)
    args = commandLineArgs(argumentDefinitions) as CLIArguments
    if (!args.dirs || args.dirs.length != 2) {
        console.log("")
        console.log("Usage:")
        console.log("yarn cli [src-dir] [out-dir] [--lang [typescript/flow]] [--pattern '**/*.{tsx,ts,js,jsx}']")
        console.log("")
        console.log("Example:")
        console.log("yarn cli ../my-project/src ../my-project/framer")
        console.log("")
        return
    }
    const srcDir = args.dirs[0]
    const outDir = args.dirs[1]
    const lang = args.lang || "typescript"
    const pattern = args.pattern || "**/*.{tsx,ts,js,jsx}"
    console.log({ pattern, outDir, lang })
    const relativeFiles = await globAsync(pattern, srcDir)
    const srcFiles = relativeFiles.map(t => path.join(srcDir, t))
    const processedFiles = await analyze(srcFiles, lang)
    for (const file of processedFiles) {
        const srcFile = file.srcFile
        const relativeFile = path.relative(srcDir, srcFile)
        console.log("Processing", relativeFile)
        if (!file.components || !file.components.length) {
            console.log("Skipping", relativeFile)
            continue
        }
        for (const comp of file.components) {
            convert(comp)
        }
        const sb: string[] = []
        for (const comp of file.components) {
            sb.push(generate(comp))
        }
        const generatedCode = sb.join("")
        if (!generatedCode) {
            console.log("Skipping", relativeFile)
            continue
        }
        if (!outDir) {
            console.log(generatedCode)
            continue
        }
        const prettierCode = await makePrettier(generatedCode, file.srcFile)
        let outFile = path.join(outDir, relativeFile)
        outFile = changeExtension(outFile, ".tsx")
        console.log("Saving", outFile)
        await fse.ensureDir(path.dirname(outFile))
        await fse.writeFile(outFile, prettierCode)
    }
}
main()
