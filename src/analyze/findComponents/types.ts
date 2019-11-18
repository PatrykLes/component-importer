import * as ts from "typescript"
import { ComponentInfo } from "../../types"

export enum ResultType {
    SourceFile = "SourceFile",
    ComponentInfo = "ComponentInfo",
}

/**
 * A component finder can either find components or link to a SourceFile where components can be found.
 */
export type ComponentFinderResult =
    | {
          type: ResultType.SourceFile
          sourceFile: ts.SourceFile
      }
    | {
          type: ResultType.ComponentInfo
          componentInfo: ComponentInfo
      }

export type ComponentFinder = {
    /**
     * Given a node as input, returns the extracted components
     */
    extract(node: ts.Statement, program: ts.Program): ComponentFinderResult[]
}
