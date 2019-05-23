import * as fse from "fs-extra"
import glob from "glob"
import path from "path"
import { convert, generate } from "./process"
import { makePrettier, changeExtension } from "./utils"
import { analyzeTypeScript } from "./typescript"
import { analyzeBabel } from "./babel"
import { ProcessedFile } from "./types"
import { OptionDefinition } from "command-line-args"
import commandLineArgs = require("command-line-args")

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
        console.log("yarn cli [src-dir] [out-dir] [--lang [typescript/flow]] [--pattern '**/*.{tsx,ts,js,jsx}]'")
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
    const relativeFiles = await new Promise<string[]>(resolve =>
        glob(pattern, { cwd: srcDir }, (err, files) => resolve(files)),
    )
    // console.log(relativeFiles)
    let processedFiles: ProcessedFile[]
    if (lang == "flow") {
        processedFiles = await analyzeBabel(srcDir, relativeFiles)
    } else {
        processedFiles = await analyzeTypeScript(srcDir, relativeFiles)
    }
    for (const file of processedFiles) {
        const { relativeFile } = file
        for (const comp of file.components) {
            convert(comp)
        }
        console.log("Processing", relativeFile)
        const generatedCode = generate(file)
        if (!generatedCode) {
            console.log("Skipping", relativeFile)
            continue
        }
        if (!outDir) {
            console.log(generatedCode)
            continue
        }
        const prettierCode = await makePrettier({ file: file.file, code: generatedCode })
        let outFile = path.join(outDir, relativeFile)
        outFile = changeExtension(outFile, ".tsx")
        console.log("Saving", outFile)
        await fse.ensureDir(path.dirname(outFile))
        await fse.writeFile(outFile, prettierCode)
    }
}
main()
