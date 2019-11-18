import fs from "fs"
import util from "util"
import * as rd from "react-docgen"
import { ProcessedFile } from "./types"
import { ComponentInfo } from "../types"
import { PropType, PropTypeName } from "./extractPropTypes/types"
import { flatMap } from "../utils"
import { extractFlowPropType, extractPlainPropType } from "./extractPropTypes"
import { exportedNameHandler } from "./handlers/exportedNameHandler"

const handlers = [...rd.defaultHandlers, exportedNameHandler]

type AnalyzeOptions = {
    verbose?: boolean
}

/**
 * Analyzes plain, or Flow-typed JavaScript code and returns an array of processed files with the components that were found in the process.
 *
 * @param files the files to analyze.
 */
export async function analyzeFlowAndPlainJavaScript(
    files: string[],
    opts: AnalyzeOptions = {},
): Promise<ComponentInfo[]> {
    const processed: ProcessedFile[] = files.map(t => ({
        components: [],
        srcFile: t,
    }))

    const { verbose = false } = opts

    for (const file of processed) {
        try {
            if (verbose) {
                console.log(`\nProcessing file ${file.srcFile}`)
            }
            const sourceCode = fs.readFileSync(file.srcFile, "utf8")
            if (!sourceCode) {
                throw new Error("File is empty")
            }
            await analyze(sourceCode, file, opts)
        } catch (error) {
            if (verbose) {
                console.log(`Error processing ${file.srcFile}: ${error.message}`)
            }
        }
    }

    return flatMap(processed, p => p.components)
}

function analyze(sourceCode: string, processedFile: ProcessedFile, opts: AnalyzeOptions = {}) {
    const { verbose = false } = opts

    try {
        // Skip components without a display name
        // TODO: use filename when display name resolution fails
        const parseResult = rd
            .parse(sourceCode, rd.resolver.findAllExportedComponentDefinitions, handlers, {
                filename: processedFile.srcFile,
            })
        const components = (Array.isArray(parseResult) ? parseResult : [parseResult])
            .map(toComponentInfo)
            .filter(component => component.name)

        if (verbose) {
            if (components.length === 0) {
                console.log("No suitable component definition found.")
            } else {
                console.log(
                    `Extracted ${components.length} component${components.length !== 1 ? "s" : ""}:`,
                    util.inspect(components.map(c => c.name)),
                )
            }
        }
        processedFile.components = components
    } catch (parseError) {
        if (verbose) {
            if (parseError.message === "No suitable component definition found.") {
                console.log(parseError.message)
            } else {
                console.log(parseError)
            }
        }
    }
}

function toComponentInfo(info: rd.Documentation): ComponentInfo {
    const props = Object.keys(info.props || {})
        // In the case where the code includes a defaultProps statement for a prop,
        // but doesn't define that prop in propTypes, the parser will still consider
        // the prop, but not assign it a type, just a defaultValue.
        // For now, we will discard props without type information.
        // TODO: Auto-infer type based on defaultValue.
        .filter(p => "type" in info.props[p] || "flowType" in info.props[p])
        .map(name => {
            return toPropType({
                name,
                ...info.props[name],
            })
        })

    const exportedName = info.exportedName || info.displayName

    return {
        name: exportedName,
        propTypes: props,
    }
}

function toPropType(prop: rd.PropTypeDescriptor): PropType {
    const extractors = [extractFlowPropType, extractPlainPropType]
    for (const extractor of extractors) {
        const t = extractor(prop)
        if (t && t.type !== PropTypeName.unsupported) {
            return t
        }
    }
    return {
        type: PropTypeName.unsupported,
        name: prop.name,
    }
}
