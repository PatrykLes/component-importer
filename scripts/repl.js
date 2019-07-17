const ts = require("typescript")
const fs = require("fs")
const path = require("path")
const glob = require("glob").sync

const file = process.argv[2]

const getFiles = file => {
    if (!file || !fs.existsSync(file)) {
        throw new Error(`File ${file} doesn't exist.`)
    }
    const directory = path.dirname(file)
    return glob(path.join(directory, "**/*.{ts,tsx,d.ts}"))
}

const parseTsConfig = tsConfigPath => {
    const { error, config } = ts.readConfigFile(tsConfigPath, ts.sys.readFile)
    if (error) {
        throw new Error(`Unable to find tsconfig.json under ${tsConfigPath}`)
    }
    return config
}

children = node => {
    const result = new Set()
    const remainingNodes = [node]
    while (remainingNodes.length > 0) {
        const node = remainingNodes.pop()
        const children = Array.from(node.getChildren())
        result.add(node)
        remainingNodes.push(...children)
    }
    return Array.from(result)
}

const program = ts.createProgram({
    options: parseTsConfig("tsconfig.json"),
    rootNames: getFiles(file),
})

const checker = program.getTypeChecker() // to make sure the parent nodes are set

const sourceFile = program.getSourceFile(file)

const statements = sourceFile.statements

console.log(statements)
