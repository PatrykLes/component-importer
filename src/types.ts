import { printExpression, valueToTS } from "./utils"
import * as ts from "typescript"

export interface ProcessedFile {
    relativeFile: string
    file: string
    generatedCode: string
    components: ComponentInfo[]
}

export interface ComponentInfo {
    name: string
    // propsTypeNode: ts.TypeNode
    // propsType: ts.Type
    propsTypeInfo: TypeInfo
    componentName: string
    framerName: string
    propertyControls: PropertyControls
}

export interface TypeInfo {
    name?: string
    possibleValues?: any[]
    isEnum?: boolean
    properties?: PropertyInfo[]
}
export interface PropertyInfo {
    name: string
    type: TypeInfo
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
            if (key == "type") {
                return ts.createIdentifier(value)
            }
        })
        return printExpression(node)
    }
}
