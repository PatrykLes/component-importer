# Using the Component Importer as a TypeScript Library

Although the most common way of using the `component-importer` is as a CLI, it can also be used as a library.

**Note**: This is an experimental feature. Expect breaking API changes.

## Finding React components in a project

You can use the `analyzeTypeScript`, `analyzeFlow` and `analyzePlainJavaScript` functions to retrieve an array of React components with
their properties.

For example, to extract component definitions from a `.d.ts` file:

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

If TypeScript definitions are not available, you can analyze files that have Flow type definitions with `analyzeFlow`, or fall back to plain `propTypes` support:

```ts
import { analyzePlainJavaScript } from "@framerjs/component-importer"

async function printReactComponents() {
    const components = await analyzePlainJavaScript(["path/to/component1.js", "path/to/component2.js"])

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
