import * as fse from "fs-extra"
import glob from "glob"
import path from "path"
import { processFile } from "./process"

async function main() {
    if (!process.argv[2]) {
        console.log("")
        console.log("Usage:")
        console.log("yarn cli [file-pattern] [out-dir]")
        console.log("")
        console.log("Example:")
        console.log("yarn cli ../my-project/src/**/*.tsx ../my-project/framer")
        console.log("")
        return
    }
    const pattern = process.argv[2]
    const outDir = process.argv[3]
    console.log({ pattern, outDir })
    const files = await new Promise<string[]>(resolve => glob(pattern, (err, files) => resolve(files)))
    console.log(files)
    for (const file of files) {
        console.log("Processing", file)
        const code = await processFile(file)
        if (!code) {
            console.log("Skipping", file)
            continue
        }
        if (!outDir) {
            console.log(code)
            continue
        }
        const outFile = path.join(outDir, path.basename(file))
        console.log("Saving", outFile)
        await fse.ensureDir(path.dirname(outFile))
        await fse.writeFile(outFile, code)
    }
}
main()
