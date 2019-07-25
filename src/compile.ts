import { convert } from "./convert"
import { emit } from "./generate"
import { analyzeTypeScript } from "./typescript"
import { flatMap } from "./utils"
import { EmitResult, CompileOptions } from "./types"

/**
 * Runs all the compilers steps, namely
 *
 * 1. analize: finds react components in a source tree
 * 2. convert: converts the analized components into a "framer component" data structure
 * 3. emit: returns the output that will eventually be written to disc
 */
export async function compile({ rootFiles, tsConfigPath, packageName }: CompileOptions): Promise<EmitResult[]> {
    const processedFiles = await analyzeTypeScript(rootFiles, tsConfigPath)

    const components = flatMap(processedFiles, files => files.components)

    for (const comp of components) {
        convert(comp)
    }

    return emit({ packageName, components })
}
