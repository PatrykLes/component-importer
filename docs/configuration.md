# Configuration

The main point of configuration for the `component-importer` is the `importer.config.json` file, which is by convention located at the root of your Framer X package.

**NOTE**: All paths will be resolved relative to the `importer.config.json`'s location.

For the purpose of this guide we are going to assume that we're importing the `grommet` design system.

```json
{
    "packageName": "grommet",
    "rootFiles": [
        "node_modules/grommet/index.d.ts",
    ],
    "out": "code/",
    "cssImports": ["import/path/to/main.css"],
    "components": {
        "Button": {
            "ignore": false,
            "ignoredProps": ["margin"]
        },
        "Heading": {
            "ignore": false,
        },
        "AccordionPanel": {
            "ignore": true
        },
    },
}
```

#### `packageName`

The `packageName` is the name of the NPM package of the design system to be imported. That package must be present in your Framer X project's `node_modules`, so make sure it was previously added (For example by running `yarn add grommet`).

#### `rootFiles`

The `rootFiles` is an array of strings that point to the package's TypeScript definitions.

#### `out`

A path to the folder where generated components will be written to. Components are written to `{out}/{componentName}` by default, so in our example the importer will generate the following files:

```
.
└── code
    ├── Button.tsx
    └── Image.tsx

1 directory, 2 files
```

Notice that the `AccordionPanel` is not generated because it is set to `ignore: true`. More on this in the `components` section below.

#### `components`

The `components`: object lets you add additional configuration on a per-component basis. Each key represents the name of a component. You can configure the following properties for each component:

- `ignore`: (`string`) If set to true, the `component-importer` will ignore this component, meaning it won't generate any code. This is useful for components that are not useful in the context of Framer X and you don't want them to be re-generated when you run the `component-importer`.

- `ignoredProps`: (`string[]`) An array of props that will be excluded from code generation.

#### `cssImports`

Some design systems will require that you import additional css files in order for components to be styled properly. Paths entered here will be directly converted to `import` statements.
Example:

```json
"cssImports": ["path/to/file.css"]
```

Will be translated to an `import "path/to/file.css"` statement on each generated component.




