import { ComponentInfo } from "../types"
import * as ts from "typescript"
import { ComponentFinder, ResultType } from "./types"
import { aliasedSymbolFinder } from "./aliasedSymbolFinder"
import { classComponentFinder } from "./classComponentFinder"
import { exportDeclarationFinder } from "./exportDeclarationFinder"
import { exportStarFinder } from "./exportStarFinder"
import { functionDeclarationFinder } from "./functionDeclarationFinder"
import { referenceComponentFinder } from "./referenceComponentFinder"
import { variableStatementFinder } from "./variableStatementFinder"

export function* findComponents(sourceFile: ts.SourceFile, program: ts.Program): IterableIterator<ComponentInfo> {
    const componentFinders: ComponentFinder[] = [
        aliasedSymbolFinder,
        classComponentFinder,
        exportDeclarationFinder,
        exportStarFinder,
        functionDeclarationFinder,
        referenceComponentFinder,
        variableStatementFinder,
    ]

    const remainingStatements = Array.from(sourceFile.statements)

    for (const node of remainingStatements) {
        for (const componentFinder of componentFinders) {
            for (const comp of componentFinder.extract(node, program)) {
                if (comp.type === ResultType.ComponentInfo) {
                    yield comp.componentInfo
                }
                if (comp.type === ResultType.SourceFile) {
                    remainingStatements.push(...comp.sourceFile.statements)
                }
            }
        }
    }
}
