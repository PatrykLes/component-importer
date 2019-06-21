import { ComponentInfo, ProcessedFile, PropertyControl, PropertyControls } from "./types"
import { upperCaseFirstLetter } from "./utils"

/** Converts a component into a framer component by generated names and property controls */
export function convert(comp: ComponentInfo) {
    comp.componentName = `System.${comp.name}`
    comp.framerName = comp.name

    comp.propertyControls = new PropertyControls()
    if (comp.propsTypeInfo && comp.propsTypeInfo.properties) {
        for (const prop of comp.propsTypeInfo.properties) {
            let pc = new PropertyControl({ name: prop.name })
            pc.doc = prop.doc
            pc.title = upperCaseFirstLetter(pc.name)
            const meType = prop.type
            if (!meType) {
                console.log("Skipping PropertyControl for", prop.name)
                continue
            }
            let type: string
            if (meType.isEnum) {
                type = "ControlType.Enum"
                pc.options = meType.possibleValues
                pc.optionTitles = pc.options.map(t => upperCaseFirstLetter(String(t)))
            } else if (meType.name == "string") {
                type = "ControlType.String"
            } else if (meType.name == "boolean" || meType.name == "bool") {
                type = "ControlType.Boolean"
            } else {
                console.log("Skipping PropertyControl for", prop.name)
                continue
            }
            pc.type = type
            comp.propertyControls.add(pc)
        }
    }
}
