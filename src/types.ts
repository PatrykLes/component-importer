import { printExpression, valueToTS } from "./utils"
import * as ts from "typescript"
import * as babel from "@babel/types"

export interface ProcessedFile {
    srcFile: string
    components: ComponentInfo[]
}

export interface ComponentInfo {
    name: string
    propsTypeInfo?: TypeInfo
    componentName?: string
    framerName?: string
    propertyControls?: PropertyControls
}

export interface TypeInfo {
    // XXX: This definition is likely incomplete
    // normalize bool/boolean (seems like one is used for typescript the other for babel)
    name?: "string" | "number" | "boolean" | "bool"
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
    options: (string | number)[]
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
            if (key == "doc") return null
            if (key == "type") {
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
