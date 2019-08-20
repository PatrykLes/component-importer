import { CompileOptions, ComponentInfo, EmitConfigurationResult } from "../types"
import { indexByRemovingKey } from "../utils"

type EmitConfigurationOptions = {
    packageName: string
    tsconfigPath?: string
    rootFiles: string[]
    additionalImports?: string[]
    components: ComponentInfo[]
}

export function emitConfiguration(opts: EmitConfigurationOptions): EmitConfigurationResult {
    const components = opts.components.map(({ name, propTypes }) => ({
        name,
        ignore: false,
        // TODO: consider re-enabling this later on. Right now it doesn't make much sense because it
        // results in pretty much just useless configuration duplication.
        //
        // props: indexByRemovingKey(propTypes, "name"),
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
        configuration,
        outputSource: JSON.stringify(configuration, null, 4),
    }
}
