# ComponentImporter

Example utility that helps importing React components into Framer with basic support for TypeScript.

## Getting Started

To install run `yarn add @framerjs/component-importer`.

## Command Line

Run `component-importer --help` for documentation on how to use the component-importer from the command-line.

### Example: writing a simple CLI

The component importer exposes a few functions, the most useful one is the `compile` functions which
takes a `CompileOptions` as input and returns an `EmitResult[]`.

```typescript
import { compile } from "@framerjs/component-importer"

async function main() {
    const outFiles = await compile({
        rootFiles: ["my-package/src/index.tsx"],
        packageName: "my-package",
        tsConfigPath: "my-package/tsconfig.json",
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
```
