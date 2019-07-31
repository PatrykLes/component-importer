import { EmitResult, ComponentInfo, CompileOptions } from "../types"
import { indexByRemovingKey } from "../utils"

type EmitConfigurationOptions = {
    packageName: string
    tsconfigPath?: string
    rootFiles: string[]
    additionalImports?: string[]
    components: ComponentInfo[]
}

export function emitConfiguration(opts: EmitConfigurationOptions): EmitResult {
    const components = opts.components.map(({ name, propTypes }) => ({
        name,
        ignore: false,
        props: indexByRemovingKey(propTypes, "name"),
    }))

    const componentsByName = indexByRemovingKey(components, "name")

    const configuration: CompileOptions = {
        packageName: opts.packageName,
        tsConfigPath: opts.tsconfigPath,
        rootFiles: opts.rootFiles,
        additionalImports: [],
        out: "code/",
        components: componentsByName,
    }

    return {
        type: "configuration",
        fileName: "importer.config.json",
        outputSource: JSON.stringify(configuration, null, 4),
    }
}
