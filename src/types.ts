import * as babel from "@babel/types"
import * as ts from "typescript"
import { printExpression, valueToTS } from "./utils"

export interface ProcessedFile {
    srcFile: string
    components: ComponentInfo[]
}

/**
 * The types of files emited by the compiler
 *
 * - `inferredControls`: expose a components inferred property controls.
 * - `component`: expose a component's scaffold or starting template.
 */
export type EmitResult =
    | { type: "inferredControls"; fileName: string; outputSource: string }
    | { type: "component"; fileName: string; outputSource: string }

/**
 * The compiler's options.
 */
export type CompileOptions = {
    /**
     * The set of root files from which the compiler will start traversing the source code.
     * Usually this is a single file `src/index.d.ts`, `src/index.tsx` or `src/index.ts`
     */
    rootFiles: string[]
    /**
     * The path to the project's tsconfig. If not supplied, a default tsocnfig will be applied instead.
     */
    tsConfigPath?: string
    /**
     * e.g. @mui/material-ui
     */
    packageName: string
}

export interface ComponentInfo {
    name: string
    propTypes: PropType[]
    componentName?: string
    framerName?: string
    propertyControls?: PropertyControls
}

export type PropType =
    | {
          type: "boolean" | "string"
          name: string
      }
    | {
          type: "number"
          name: string
          min?: number
          max?: number
      }
    | {
          type: "enum"
          name: string
          possibleValues: any[]
      }
    | {
          type: "array"
          name: string
          of: PropType
      }
    | {
          type: "unsupported"
          name: string
      }

export interface TypeInfo {
    // XXX: This definition is likely incomplete
    // normalize bool/boolean (seems like one is used for typescript the other for babel)
    name?: string
    possibleValues?: any[]
    isEnum?: boolean
    properties?: PropertyInfo[]
    rawType?: ts.Type | babel.FlowType
}
export interface PropertyInfo {
    name: string
    type: TypeInfo
    doc?: string
}

export class PropertyControls {
    add(pc: PropertyControl) {
        this.items.push(pc)
    }
    toJS() {
        return PropertyControl.toJS(this.items)
    }
    items: PropertyControl[] = []
}
export class PropertyControl {
    doc: string
    constructor(opts?: Partial<PropertyControl>) {
        opts && Object.assign(this, opts)
    }
    name: string
    type: string
    options: (string | number | boolean)[]
    optionTitles: string[]
    title: string
    toEntry(): [string, any] {
        const props = { ...this }
        delete props.name
        return [this.name, props]
    }
    static toJS(list: PropertyControl[]) {
        const entries = list.map(t => t.toEntry())
        const obj: any = {}
        for (const entry of entries) obj[entry[0]] = entry[1]
        const node = valueToTS(obj, (key, value) => {
            // Dont include aria-* (accessibility) fields, they are (probably) not needed for most prototyping needs. Consider
            // adding support for them later.
            if (/aria-/.test(key)) {
                return null
            }

            if (key == "doc") return null
            if (key == "type" && typeof value === "string") {
                return ts.createIdentifier(value)
            }
        })

        if (ts.isObjectLiteralExpression(node)) {
            for (const prop of node.properties) {
                if (ts.isPropertyAssignment(prop)) {
                    const identifier = prop.name
                    if (ts.isIdentifier(identifier)) {
                        const propName = identifier.text
                        const pc = list.find(t => t.name == propName)
                        if (!pc || !pc.doc) continue
                        ts.addSyntheticLeadingComment(
                            prop.initializer,
                            ts.SyntaxKind.MultiLineCommentTrivia,
                            //"*\n* " + pc.doc + "\n *",
                            "* " + pc.doc + " ",
                            true,
                        )
                    }
                }
            }
        }
        return printExpression(node)
    }
}
