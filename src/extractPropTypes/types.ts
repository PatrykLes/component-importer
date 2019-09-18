import ts from "typescript"

export type Primitive = string | boolean | number | undefined | null

export type PropType =
    | {
          type: "boolean"
          name: string
          defaultValue?: boolean
      }
    | {
          type: "string"
          name: string
          defaultValue?: string
      }
    | {
          type: "color"
          name: string
          defaultValue?: string
      }
    | {
          type: "number"
          name: string
          min?: number
          max?: number
          step?: number
          defaultValue?: number
      }
    | {
          type: "enum"
          name: string
          possibleValues: Primitive[]
          defaultValue?: Primitive
      }
    | {
          type: "array"
          name: string
          of: PropType
          defaultValue?: Primitive[]
      }
    | {
          type: "unsupported"
          name: string
      }

export type PropTypeFinder = (propSymbol: ts.Symbol, propType: ts.Type) => PropType | undefined
