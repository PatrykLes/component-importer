import fs from "fs"
import path from "path"
import ts, { Program, SourceFile, StringLiteral } from "typescript"
import { ComponentFinder, ComponentFinderResult, ResultType } from "./types"

/**
 * Extracts SourceFiles from `export * from "./path/to/file"` syntax.
 */
export const exportStarFinder: ComponentFinder = {
    extract(node: ts.Statement, program: ts.Program): ComponentFinderResult[] {
        if (!ts.isExportDeclaration(node) || !!node.exportClause) return []

        // When node is export * from "./path", the only string literal is the path node.
        const pathNode = node.getChildren().find(ts.isStringLiteral) as StringLiteral

        if (!pathNode) return []

        const relativeImportPath = pathNode.text
        const { fileName } = pathNode.getSourceFile()
        const resolvedImport = path.join(path.dirname(fileName), relativeImportPath)

        const sourceFiles: SourceFile[] = findSourceFiles(program, resolvedImport)

        return sourceFiles.map(sourceFile => {
            return {
                type: ResultType.SourceFile,
                sourceFile,
            }
        })
    },
}

// XXX this is a super hacky way of findind a source file given an import path.
// It takes into account the fact that an import can result in a tsx, tsx, /index.ts, etc.
// Ideally the ts compiler should have a way to resolve these references, but I wasn't able to find
// how
export function findSourceFiles(program: Program, importPath: string): SourceFile[] {
    return [".ts", ".tsx", ".d.ts", "/index.ts", "/index.tsx", "/index.d.ts"]
        .map(extension => `${importPath}${extension}`)
        .filter(filePath => fs.existsSync(filePath))
        .map(filePath => {
            const sourceFile = program.getSourceFile(filePath)

            return sourceFile
        })
        .filter(sourceFile => {
            return !!sourceFile
        })
}
