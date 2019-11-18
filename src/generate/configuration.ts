import { CompileOptions, ComponentInfo, EmitConfigurationResult, ComponentConfiguration } from "../types"
import { indexByRemovingKey } from "../utils"

type EmitConfigurationOptions = {
    mode: "typescript" | "flow" | "plain"
    packageName: string
    tsconfigPath?: string
    rootFiles?: string[]
    additionalImports?: string[]
    components: ComponentInfo[]
    include?: string
    ignore?: string[]
}

export function emitConfiguration(opts: EmitConfigurationOptions): EmitConfigurationResult {
    const components = opts.components.map(({ name }) => ({
        name,
        ignore: false,
    }))

    const componentsByName: Record<string, ComponentConfiguration> = indexByRemovingKey(components, "name")

    const configuration: Omit<CompileOptions, "projectRoot"> = {
        mode: opts.mode,
        packageName: opts.packageName,
        tsConfigPath: opts.tsconfigPath,
        rootFiles: opts.rootFiles,
        include: opts.include,
        ignore: opts.ignore,
        additionalImports: [],
        out: "code/",
        components: componentsByName,
    }

    return {
        type: "configuration",
        fileName: "importer.config.json",
        configuration,
        outputSource: JSON.stringify(configuration, null, 4),
    }
}
