import ts from "typescript"

export type PropType =
    | {
          type: "boolean"
          name: string
          defaultValue?: boolean
          title?: string
      }
    | {
          type: "string"
          name: string
          defaultValue?: string
          title?: string
      }
    | {
          type: "color"
          name: string
          defaultValue?: string
          title?: string
      }
    | {
          type: "number"
          name: string
          min?: number
          max?: number
          step?: number
          defaultValue?: number
          title?: string
      }
    | {
          type: "enum"
          name: string
          possibleValues: any[]
          title?: string
      }
    | {
          type: "array"
          name: string
          of: PropType
          title?: string
      }
    | {
          type: "unsupported"
          name: string
      }

export type PropTypeFinder = (propSymbol: ts.Symbol, propType: ts.Type) => PropType | undefined
