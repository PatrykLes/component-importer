import { assert } from "../assert"
import ts, { StringLiteral } from "typescript"
import { ComponentFinder, ComponentFinderResult, ResultType } from "./types"
import { findSourceFiles, isExportStar } from "./utils"

/**
 * Extracts SourceFiles from `export * from "./path/to/file"` syntax.
 */
export const exportStarFinder: ComponentFinder = {
    extract(node: ts.Statement, program: ts.Program): ComponentFinderResult[] {
        if (!ts.isExportDeclaration(node) || !isExportStar(node)) return []

        // When node is export * from "./path", the only string literal is the path node.
        const pathNode = node.getChildren().find(ts.isStringLiteral) as StringLiteral

        assert(pathNode, `Expected node ${node.getText()} to have a string literal`)

        return findSourceFiles(program, pathNode).map(sourceFile => {
            return {
                type: ResultType.SourceFile,
                sourceFile,
            }
        })
    },
}
