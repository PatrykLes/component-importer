import * as ts from "typescript"
import { ComponentInfo } from "../types"

export type ComponentFinder = {
    /**
     * Given a node as input, returns the extracted components
     */
    extract(node: ts.Statement, program: ts.Program): ComponentInfo[]
}
