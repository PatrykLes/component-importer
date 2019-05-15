import * as fse from "fs-extra"
import glob from "glob"
import path from "path"
import { processFile } from "./process"

async function main() {
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
    const pattern = "**/*.tsx"
    console.log({ pattern, outDir })
    const relativeFiles = await new Promise<string[]>(resolve =>
        glob(pattern, { cwd: srcDir }, (err, files) => resolve(files)),
    )
    console.log(relativeFiles)
    for (const relativeFile of relativeFiles) {
        console.log("Processing", relativeFile)
        const srcFile = path.join(srcDir, relativeFile)
        const code = await processFile(srcFile)
        if (!code) {
            console.log("Skipping", relativeFile)
            continue
        }
        if (!outDir) {
            console.log(code)
            continue
        }
        const outFile = path.join(outDir, relativeFile)
        console.log("Saving", outFile)
        await fse.ensureDir(path.dirname(outFile))
        await fse.writeFile(outFile, code)
    }
}
main()
