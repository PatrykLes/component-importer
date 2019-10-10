# Using the Component Importer as a Typescript Library

Although the most common way of using the `component-importer` is as a CLI, it can also be used as a library.

**Note**: This is an experimental feature. Expect breaking API changes.

## Finding react components in a TypeScript project

You can use the `analyzeTypeScript` function to retrieve an array of react components with
their properties from a typescript declaration file (`.d.ts`).

```ts
import { analyzeTypeScript } from "@framerjs/component-importer"

async function printReactComponents() {
    const components = await analyzeTypeScript(["path/to/index.d.ts"])

    for (const comp of components) {
        console.log("Component:", comp.name)

        for (const prop of comp.propTypes) {
            console.log(`Found property ${prop.name} with type ${prop.type}`)
        }
    }
}
```

You can then use this output to, for example, generate a documentation site.

## Generating Code Components

The `compile` function can be used to analyze a TypeScript project and generate Framer code components.

This example shows you how to implement a very simple program that generates Framer X code components for the `baseui` design system.

```ts
import { compile } from "@framerjs/component-importer"
import fs from "fs"

async function printReactComponents() {
    const emitResults = await compile({
        rootFiles: ["node_modules/baseui/dist/index.d.ts"],
        // The name of the NPM package to import.
        packageName: "baseui",
        // Optionally specify the location of a prettierrc used for formatting the generated code.
        prettierrc: ".prettierrc.json",
        // The location where the generated components will be written to
        out: "/code",
        // The path to the root of your Framer X project.
        projectRoot: ".",
    })

    for (const emitResult of emitResults) {
        if (emitResult.type === "component") {
            console.log(
                `Generating component at ${emitResult.emitPath}:`)
            fs.writeFileSync(emitResult.emitPath, emitResult.outputSource)
        }
    }
}
```
