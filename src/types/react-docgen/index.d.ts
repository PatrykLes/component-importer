declare module "react-docgen" {
    import { ASTNode } from "ast-types"
    import { NodePath } from "ast-types/lib/node-path"

    export type Documentation = {
        displayName?: string
        exportedName?: string
        props?: { [key: string]: PropTypeDescriptor }
        context?: { [key: string]: PropTypeDescriptor }
        childContext?: { [key: string]: PropTypeDescriptor }
        composes?: Array<string>
        set: (key: string, value: any) => void
    }

    export type PropTypeDescriptor = {
        name:
            | "arrayOf"
            | "custom"
            | "enum"
            | "array"
            | "bool"
            | "func"
            | "number"
            | "object"
            | "string"
            | "any"
            | "element"
            | "node"
            | "symbol"
            | "objectOf"
            | "shape"
            | "exact"
            | "union"
            | "elementType"
        value?: any
        raw?: string
        computed?: boolean
        type?: PropTypeDescriptor
        flowType?: FlowTypeDescriptor
        tsType?: FlowTypeDescriptor
        required?: boolean
        defaultValue?: any
        description?: string
    }

    export type FlowBaseType = {
        required?: boolean
        nullable?: boolean
        alias?: string
    }

    export type FlowSimpleType = FlowBaseType & {
        name: string
        raw?: string
    }

    export type FlowLiteralType = FlowBaseType & {
        name: "literal"
        value: string
    }

    export type FlowElementsType = FlowBaseType & {
        name: string
        raw: string
        elements: Array<FlowTypeDescriptor>
    }

    export type FlowFunctionArgumentType = {
        name: string
        type?: FlowTypeDescriptor
        rest?: boolean
    }

    export type FlowFunctionSignatureType = FlowBaseType & {
        name: "signature"
        type: "function"
        raw: string
        signature: {
            arguments: Array<FlowFunctionArgumentType>
            return: FlowTypeDescriptor
        }
    }

    export type TSFunctionSignatureType = FlowBaseType & {
        name: "signature"
        type: "function"
        raw: string
        signature: {
            arguments: Array<FlowFunctionArgumentType>
            return: FlowTypeDescriptor
            this?: FlowTypeDescriptor
        }
    }

    export type FlowObjectSignatureType = FlowBaseType & {
        name: "signature"
        type: "object"
        raw: string
        signature: {
            properties: Array<{
                key: string | FlowTypeDescriptor
                value: FlowTypeDescriptor
            }>
            constructor?: FlowTypeDescriptor
        }
    }

    export type FlowTypeDescriptor =
        | FlowSimpleType
        | FlowLiteralType
        | FlowElementsType
        | FlowFunctionSignatureType
        | FlowObjectSignatureType

    export type Handler = (documentation: Documentation, path: NodePath, parser: Parser) => void
    export type Resolver = (node: ASTNode, parser: Parser) => NodePath | Array<NodePath> | null | undefined
    export type Parser = {
        parse: (src: string) => ASTNode
    }

    type ParserOptions = {
        plugins?: Array<string | [string, {}]>
        tokens?: boolean
    }

    type BabelOptions = {
        cwd?: string
        filename?: string
        envName?: string
        babelrc?: boolean
        root?: string
        rootMode?: string
        configFile?: string | false
        babelrcRoots?: true | string | string[]
    }

    export type Options = BabelOptions & {
        parserOptions?: ParserOptions
    }

    export const defaultHandlers: Handler[]

    export const resolver: {
        findAllExportedComponentDefinitions: Resolver
    }

    export function parse(
        src: string,
        resolver: Resolver,
        handlers: Handler[],
        options: Options,
    ): Documentation[] | Documentation
}
