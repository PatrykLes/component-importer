import { analyzeBabel } from "./babel"
import { analyzeTypeScript } from "./typescript"
import { ProcessedFile } from "./types"

/** Parses the source files, looks for components in those files and analyzes their type information */
export function analyze(srcFiles: string[], lang: "typescript" | "flow" = "typescript"): Promise<ProcessedFile[]> {
    if (lang == "flow") {
        return analyzeBabel(srcFiles)
    }
    return analyzeTypeScript(srcFiles)
}
