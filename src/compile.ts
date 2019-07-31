import { convert } from "./convert"
import { emitComponents } from "./generate"
import { analyzeTypeScript } from "./typescript"
import { flatMap } from "./utils"
import { EmitResult, CompileOptions, ComponentConfiguration, ComponentInfo } from "./types"
import { PropType } from "./extractPropTypes"

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
    const processedFiles = await analyzeTypeScript(rootFiles, tsConfigPath)

    const components = flatMap(processedFiles, files => files.components)

    const convertedComponents = components
        .map(comp => {
            const componentWithOverrides = applyOverrides(comp, componentConfiguration[comp.name])
            if (!componentWithOverrides) {
                return undefined
            }
            return convert(componentWithOverrides)
        })
        .filter(comp => !!comp)

    return emitComponents({
        packageName,
        components: convertedComponents,
        additionalImports,
    })
}
