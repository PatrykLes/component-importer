import { PropType } from "./extractPropTypes"
import { emitComponents } from "./generate"
import { CompileOptions, ComponentConfiguration, ComponentInfo, EmitResult } from "./types"
import { analyzeTypeScript } from "./typescript"

const applyOverrides = (
    component: ComponentInfo,
    config: ComponentConfiguration | undefined,
): ComponentInfo | undefined => {
    if (!config) {
        return component
    }

    if (config.ignore) {
        return undefined
    }

    const newPropTypes = component.propTypes.map(propType => {
        const propTypeOverrides = (config.props || {})[propType.name]
        return {
            ...propType,
            ...propTypeOverrides,
        }
    }) as PropType[]

    return {
        ...component,
        propTypes: newPropTypes,
    }
}

/**
 * Runs all the compilers steps, namely
 *
 * 1. analize: finds react components in a source tree
 * 2. convert: converts the analized components into a "framer component" data structure
 * 3. emit: returns the output that will eventually be written to disc
 */
export async function compile({
    rootFiles,
    tsConfigPath,
    packageName,
    additionalImports,
    components: componentConfiguration,
}: Pick<CompileOptions, "rootFiles" | "tsConfigPath" | "packageName" | "additionalImports" | "components">): Promise<
    EmitResult[]
> {
    const components = await analyzeTypeScript(rootFiles, tsConfigPath)

    const convertedComponents = components
        .map(comp => {
            return applyOverrides(comp, componentConfiguration[comp.name])
        })
        .filter(comp => !!comp)

    return emitComponents({
        packageName,
        components: convertedComponents,
        additionalImports,
    })
}
