import { GeneratorOptions } from "@babel/core"

declare module "@babel/generator" {
    export default function(ast: any): GenerateResult
    export interface GenerateResult {
        code: string
    }

    export interface GeneratorOptions {}
}
