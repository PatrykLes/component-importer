# Configuration

The main point of configuration for the `component-importer` is the `importer.config.json` file, which must be located at the root of your Framer X package.

**NOTE**: All paths will be resolved relative to the `importer.config.json`'s location.

For the purpose of this guide we are going to assume that we're importing the `grommet` design system. Let's look at a sample `importer.config.json`:

```json
{
    "packageName": "grommet",
    "mode": "typescript",
    "rootFiles": [
        "node_modules/grommet/index.d.ts",
    ],
    "out": "code/",
    "additionalImports": ["import/path/to/main.css"],
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

The `packageName` is the name of the NPM package of the design system to be imported. The package must be present in your Framer X project's `node_modules`, so make sure it was previously added (e.g. by running `yarn add grommet`). The value of `packageName` can also be a path to a directory that will be scanned for React components.

#### `mode`

The `mode` describes the flavor of JavaScript used in the design system you're importing. Can be one of `typescript`, `flow`, or `plain` for `propTypes` support in vanilla JavaScript. The default is `typescript`.

#### `rootFiles`

The `rootFiles` is an array of strings that point to the package's TypeScript definitions. Only required when `mode` is `typescript`.

#### `additionalImports`

A list of additional files to import. Use this field to add CSS files that load custom fonts, or if your components are styled through a global CSS file. Each file in the list will get its own `import` statement at the top of the HOC that wraps every component (you can find it in the generated `code/withHOC.tsx`). 

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

- `path`: (`string`) The path in which the component will be written to. E.g. `"code/buttons/PrimaryButton.tsx"`

- `ignoredProps`: (`string[]`) An array of props that will be excluded from code generation.

#### `include` (only available in `plain` and `flow` mode)

The `include` field specifies a glob pattern that will be used to scan for files that might contain React components:

```json
{
    "include": "**/*.{js,jsx}",
    ...
}
```

In `flow` mode, the component importer will also look at files with the `.flow` extension.

#### `ignore` (only available in `plain` and `flow` mode)

A list of glob patterns that match directories and files that will not be analyzed when looking for React components. You'd typically want to include tests, documentation examples, etc. in this list. The default list is:

```json
{
    "ignore": [
        "**/node_modules/**",
        "**/stories/**",
        "**/__mocks__/**",
        "**/__examples__/**",
        "**/__tests__/**",
        "**/__docs__/**",
        "**/*.test.{js,jsx}",
        "**/*-test.{js,jsx}",
        "**/*.spec.{js,jsx}",
        "**/*-spec.{js,jsx}"
    ],
    ...
}
```
