import * as fse from "fs-extra"
import glob from "glob"
import path from "path"
import { convert, generate } from "./process"
import { makePrettier, changeExtension } from "./utils"
import { analyzeTypeScript } from "./typescript"
import { analyzeBabel } from "./babel"
import { ProcessedFile } from "./types"

async function main() {
    console.log(process.argv)
    if (!process.argv[2]) {
        console.log("")
        console.log("Usage:")
        console.log("yarn cli [src-dir] [out-dir]")
        console.log("")
        console.log("Example:")
        console.log("yarn cli ../my-project/src ../my-project/framer")
        console.log("")
        return
    }
    const srcDir = process.argv[2]
    const outDir = process.argv[3]
    const babel = process.argv[4] == "--babel"
    const pattern = "**/*.{tsx,ts,js,jsx}"
    console.log({ pattern, outDir, babel })
    const relativeFiles = await new Promise<string[]>(resolve =>
        glob(pattern, { cwd: srcDir }, (err, files) => resolve(files)),
    )
    // console.log(relativeFiles)
    let processedFiles: ProcessedFile[]
    if (babel) {
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
