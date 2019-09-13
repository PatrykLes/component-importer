import { getEmitPath, isComponentIgnored, isPropIgnored } from "./compilerOptions"
import { emitComponents } from "./generate"
import {
    applyA11yHeuristic,
    applyColorHeuristic,
    applyHrefHeuristic,
    applyLabelHeuristic,
    applyHeuristics,
} from "./heuristics"
import { CompileOptions, ComponentEmitInfo, ComponentInfo, EmitResult } from "./types"
import { analyzeTypeScript } from "./typescript"

function applyIgnoredProps(opts: CompileOptions, comp: ComponentEmitInfo): ComponentEmitInfo {
    const filteredProps = comp.propTypes.filter(prop => {
        return !isPropIgnored(opts, comp.name, prop.name)
    })

    return {
        ...comp,
        propTypes: filteredProps,
    }
}

function applyIgnoredComponent(opts: CompileOptions, comp: ComponentEmitInfo): ComponentEmitInfo {
    return {
        ...comp,
        emit: !isComponentIgnored(opts, comp.name),
    }
}

function applyEmitPath(opts: CompileOptions, comp: ComponentInfo): ComponentEmitInfo {
    return {
        ...comp,
        // XXX assume that components emit by default. This implies an ordering constraint
        // between applyEmitPath and applyIgnoredComponent
        emit: true,
        emitPath: getEmitPath(opts, comp.name),
    }
}

/**
 * Runs all the compilers steps, namely
 *
 * 1. analize: finds react components in a source tree
 * 2. convert: converts the analized components into a "framer component" data structure
 * 3. emit: returns the output that will eventually be written to disc
 */
export async function compile(opts: CompileOptions): Promise<EmitResult[]> {
    const { rootFiles, tsConfigPath, packageName, additionalImports } = opts
    const components = await analyzeTypeScript(rootFiles, tsConfigPath)

    const convertedComponents = components
        // applyEmitPath must be invoked before applyIgnoredComponent
        .map(comp => applyEmitPath(opts, comp))
        .map(comp => applyIgnoredComponent(opts, comp))
        .map(comp => applyIgnoredProps(opts, comp))
        .map(applyHeuristics)

    return emitComponents({
        packageName,
        components: convertedComponents,
        additionalImports,
    })
}
