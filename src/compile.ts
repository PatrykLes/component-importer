import fs from "fs"
import { getEmitPath, isComponentIgnored, isPropIgnored } from "./compilerOptions"
import { emitComponents, emitMerge } from "./generate"
import { applyHeuristics } from "./heuristics"
import { CompileOptions, ComponentEmitInfo, ComponentInfo, EmitResult } from "./types"
import { analyzeTypeScript, createFramerXProgram } from "./analyze/typescript"
import { analyzeFlow, analyzePlainJavaScript } from "./analyze"
import { createPrettierFormatter, partitionBy, findFilesAtImportPath } from "./utils"

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
 * 1. analyze: finds react components in a source tree
 * 2. convert: converts the analized components into a "framer component" data structure
 * 3. emit: returns the output that will eventually be written to disc
 */
export async function compile(opts: CompileOptions): Promise<EmitResult[]> {
    const {
        mode,
        rootFiles,
        tsConfigPath,
        packageName,
        additionalImports,
        prettierrc,
        projectRoot,
        out,
        ignore,
        include,
        verbose,
    } = opts
    const formatter = await createPrettierFormatter(prettierrc)
    let components: ComponentInfo[]
    switch (mode) {
        case "flow": {
            const files = findFilesAtImportPath(packageName, include, ignore)
            components = await analyzeFlow(files, { verbose })
            break
        }
        case "plain": {
            const files = findFilesAtImportPath(packageName, include, ignore)
            components = await analyzePlainJavaScript(files, { verbose })
            break
        }
        case "typescript":
        default: {
            components = await analyzeTypeScript(rootFiles, tsConfigPath)
        }
    }

    const framerProjectProgram = createFramerXProgram(projectRoot)

    const allComponents = components
        // applyEmitPath must be invoked before applyIgnoredComponent
        .map(comp => applyEmitPath(opts, comp))
        .map(comp => applyIgnoredComponent(opts, comp))
        .map(comp => applyIgnoredProps(opts, comp))
        .map(applyHeuristics)
        .filter(comp => comp.emit)

    const [componentsToMerge, componentsToEmit] = partitionBy(allComponents, comp => fs.existsSync(comp.emitPath))

    const mergeResults = emitMerge({ formatter, framerProjectProgram, components: componentsToMerge })
    const emitResults = emitComponents({
        formatter,
        packageName,
        outDir: out,
        components: componentsToEmit,
        additionalImports,
    })

    return mergeResults.concat(emitResults)
}
