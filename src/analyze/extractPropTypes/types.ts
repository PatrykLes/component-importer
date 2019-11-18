import ts from "typescript"

export enum PropTypeName {
    boolean = "boolean",
    string = "string",
    color = "color",
    number = "number",
    enum = "enum",
    array = "array",
    unsupported = "unsupported",
}

export type Primitive = string | boolean | number | undefined | null

export type PropType =
    | {
          type: PropTypeName.boolean
          name: string
          defaultValue?: boolean
      }
    | {
          type: PropTypeName.string
          name: string
          defaultValue?: string
      }
    | {
          type: PropTypeName.color
          name: string
          defaultValue?: string
      }
    | {
          type: PropTypeName.number
          name: string
          min?: number
          max?: number
          step?: number
          defaultValue?: number
      }
    | {
          type: PropTypeName.enum
          name: string
          possibleValues: Primitive[]
          defaultValue?: Primitive
      }
    | {
          type: PropTypeName.array
          name: string
          of: PropType
          defaultValue?: Primitive[]
      }
    | {
          type: PropTypeName.unsupported
          name: string
      }

export type PropTypeFinder = (propSymbol: ts.Symbol, propType: ts.Type) => PropType | undefined
