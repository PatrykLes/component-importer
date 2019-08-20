# component-importer

The `component-importer` is a command line tool that makes it easy to import typescript-based React design systems into Framer X.

## Getting Started

To install run `yarn global add @framerjs/component-importer`. This will install the global `component-importer` binary.

Type `component-importer --help` for detailed information on how to use the `component-importer`.

# Example 1: importing the [grommet](https://v2.grommet.io/) design system

## Step 1: project setup

Create a Framer X [folder backed project](https://www.framer.com/support/using-framer-x/folder-backed-projects/):

 - Create a new Framer X project
 - Hold Option and click File › Save As
 - In the save dialog, click the File Format dropdown and select Framer X (Folder)
 - Click Save

## Step 2: setup the importer.config.json

In order to configure the component importer you will need to setup a configuration file, usually at the root of your project.
The `component-importer init` command will help you setup decent defaults.

The general syntax is `component importer init <packageName>`, example `component-importer init @blueprintjs/core` will attempt to import the "@blueprintjs/core" package.

```bash
# cd into the project created in the 'project setup' step.
cd ~/my-project.framerfx

# Add grommet and styled-components, since its a peerDependency of grommet
yarn add grommet styled-components

component-importer init grommet 
```

## Step 3: generate the components

Now that all the configuration is done you can jsut run `component-importer generate`.
It will use the `importer.config.json` from the previous step to import your design system's components.

# Example 2: importing from a relative path

## Step 1: project setup

Create a Framer X [folder backed project](https://www.framer.com/support/using-framer-x/folder-backed-projects/).

## Step 2: setup the importer.config.json

In order to configure the component importer you will need to setup a configuration file, usually at the root of your project.
The `component-importer init` command will help you setup decent defaults.

```bash
# cd into the project created in the 'project setup' step.
cd ~/my-project.framerfx

# Run the init command
# The --importPath is just the name of the NPM package you want to import
# The --index is a path to the root of the types, usually index.d.ts or index.tsx.
component-importer init --importPath path/to/my-design-system --index path/to/my/design-system/index.tsx
```

## Step 3: generate the components

Now that all the configuration is done you can just run `component-importer generate`.
It will use the `importer.config.json` from the previous step to import your design system's components.
