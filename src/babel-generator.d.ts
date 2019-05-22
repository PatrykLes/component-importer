declare module "@babel/generator" {
    export default function(ast: any): GenerateResult
    export interface GenerateResult {
        code: string
    }
}
