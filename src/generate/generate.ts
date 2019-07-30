import prettier from "prettier"
import { ComponentInfo, EmitResult } from "../types"
import { flatMap } from "../utils"

/** Emits the code for a framer component */
function generate(packageName: string, comp: ComponentInfo): string {
    const { componentName, framerName, propertyControls } = comp

    const controls = propertyControls.items
        .map(item => {
            return `${item.name}: merge(controls.${item.name}, {})`
        })
        .join(",\n")

    return `
    import * as React from "react"
    import * as System from "${packageName}"
    import { ControlType, PropertyControls, addPropertyControls } from "framer"
    import { controls, merge } from "./inferredProps/${componentName}"

    const style: React.CSSProperties = {
      width: "100%",
      height: "100%",
    }

    export function ${framerName}(props) {
      return <System.${componentName} {...props} style={style} />
    }

    ${framerName}.defaultProps = {
      width: 150,
      height: 50,
    }

    addPropertyControls(${framerName},{
        ${controls}
    })
    `
}

function generateInferredPropertyControls(comp: ComponentInfo): string {
    const controlType = comp.propertyControls.items
        .map(item => {
            return `${item.name}: ControlDescription`
        })
        .join(",\n")

    return `
    // WARNING: This is an auto-generated file. Changes to this file will be lost!
    import { ControlType, PropertyControls, ControlDescription } from "framer"

    export type Controls = {
        ${controlType}
    }

    /**
     * Contains the inferred property controls.
     */
    export const controls: Controls
        = ${comp.propertyControls.toJS()}

    export function merge(
        inferredControls: ControlDescription,
        overrides: {}
    ): ControlDescription {
        return { ...inferredControls, ...overrides };
    }
    `
}

export type EmitOptions = {
    packageName: string
    components: ComponentInfo[]
}

export async function emit({ packageName, components }: EmitOptions): Promise<EmitResult[]> {
    const makePrettier = (code: string) => prettier.format(code, { parser: "typescript" })

    return flatMap(components, comp => {
        return [
            {
                type: "inferredControls",
                fileName: `inferredProps/${comp.name}.ts`,
                outputSource: makePrettier(generateInferredPropertyControls(comp)),
            },
            {
                type: "component",
                fileName: comp.name + ".tsx",
                outputSource: makePrettier(generate(packageName, comp)),
            },
        ]
    })
}
