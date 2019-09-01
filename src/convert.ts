import { ComponentInfo, PropertyControl, PropertyControls } from "./types"
import { upperCaseFirstLetter } from "./utils"

/** Converts a component into a framer component by generated names and property controls */
export function convert(comp: ComponentInfo): ComponentInfo {
    const propertyControls = new PropertyControls()
    for (const prop of comp.propTypes) {
        if (prop.type === "unsupported") {
            continue
        }

        const pc = new PropertyControl({ name: prop.name })
        pc.doc = "" // TODO add support for documentation
        pc.title = upperCaseFirstLetter(pc.name)

        let type: string
        if (prop.type === "enum") {
            type = "ControlType.Enum"
            pc.options = prop.possibleValues
            pc.optionTitles = pc.options.map(t => upperCaseFirstLetter(String(t)))
            pc.defaultValue = prop.possibleValues[0]
        } else if (prop.type === "string") {
            type = "ControlType.String"
            pc.defaultValue = ""
        } else if (prop.type === "boolean") {
            type = "ControlType.Boolean"
            pc.defaultValue = false
        } else if (prop.type === "number") {
            type = "ControlType.Number"
        } else if (prop.type === "array") {
            // XXX add support for arrays
            continue
        } else {
            console.log("Skipping PropertyControl for", prop.name)
            continue
        }
        pc.type = type
        propertyControls.add(pc)
    }

    return {
        ...comp,
        componentName: `${comp.name}`,
        propertyControls,
    }
}
