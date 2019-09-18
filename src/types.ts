import { PropType } from "./extractPropTypes"

export type Formatter = (str: string) => string

export type EmitConfigurationResult = {
    type: "configuration"
    fileName: string
    configuration: Omit<CompileOptions, "projectRoot">
    outputSource: string
}

/**
 * The types of files emited by the compiler
 *
 * - `inferredControls`: expose a components inferred property controls.
 * - `component`: expose a component's scaffold or starting template.
 */
export type EmitResult =
    | EmitConfigurationResult
    | { type: "component"; emitPath: string; outputSource: string }
    | { type: "hoc"; fileName: string; outputSource: string }

export type ComponentConfiguration = {
    /**
     * If set to true, code will not be generated for this component.
     */
    ignore: boolean
    /**
     * The path where this component will be generated. If not specified will default to
     * the `out` option.
     */
    path?: string
    /**
     * An array of property controls to exclude from code generation.
     */
    ignoredProps?: string[]
}

/**
 * The compiler's options.
 */
export type CompileOptions = {
    /**
     * The set of root files from which the compiler will start traversing the source code.
     * Usually this is a single file `src/index.d.ts`, `src/index.tsx` or `src/index.ts`
     */
    rootFiles: string[]
    /**
     * The path to the project's tsconfig. If not supplied, a default tsocnfig will be applied instead.
     */
    tsConfigPath?: string
    /**
     * The name of NPM package of the design system to be importer.
     * e.g. @mui/material-ui
     */
    packageName: string
    /**
     * The location of your .prettierrc.json.
     */
    prettierrc?: string

    /**
     * An additional list of imports that will be added to every generated file. Useful for adding css imports.
     *
     * Example:
     *
     * ```typescript
     * ['import "path/to/css"']
     * ```
     */
    additionalImports: string[]

    /**
     * The location where the generated components will be written to.
     */
    out: string

    projectRoot: string

    components: {
        [componentName: string]: ComponentConfiguration
    }
}

export interface ComponentInfo {
    /**
     * The name of this component. e.g. Button.
     */
    name: string
    propTypes: PropType[]
}

export type ComponentEmitInfo = ComponentInfo & {
    /**
     * If false, this component will not result in any generated code.
     */
    emit: boolean
    /**
     * The path where this component will be written to.
     *
     * Example: "code/buttons/PrimaryButton.tsx"
     */
    emitPath: string
}
