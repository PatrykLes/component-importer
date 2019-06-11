# ComponentImporter

Example utility that helps importing React components into Framer with basic support for TypeScript and Flow.

## Build

```
yarn build
```

## CLI Usage

```bash
yarn cli [src-dir] [out-dir] [--lang [typescript/flow]] [--pattern '**/*.{tsx,ts,js,jsx}']
```

## Example

```bash
yarn cli ../my-project/src ../my-project/framer
```

## API Usage

* Build the project
* Run `yarn link` in the project folder
* Create a new project
* Run `yarn link component-importer` in the new project
* Add and run the following code:

```typescript
import { analyze, convert, generate, makePrettier } from "component-importer"

async function main() {
    const files = ["a.tsx", "b.tsx"]
    const processedFiles = await analyze(files, "typescript") // parses source files, analyzes components and type information
    for (const processedFile of processedFiles) {
        for (const component of processedFile.components) {            
            convert(component)                                // Adds Framer X component info (property controls)
            // Optional: customize the components before generating the code
            const code = generate(component)                  // Generates the code
            const prettyCode = await makePrettier(code)       // Formats the code
            console.log(prettyCode)
            // Save the code to a file
        }
    }
}

main()
```

Another example can be found in `src/cli.ts`
