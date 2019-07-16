import prettier from "prettier"
import { ComponentInfo } from "./types"

/** Emits the code for a framer component */
export function generate(packageName: string, comp: ComponentInfo): string {
    const { componentName, framerName, propertyControls } = comp

    return `
    import * as React from "react"
    import * as System from "${packageName}"
    import { ControlType, PropertyControls, addPropertyControls } from "framer"

    const style: React.CSSProperties = {
      width: "100%",
      height: "100%",
    }

    export const ${framerName}: React.SFC = props => {
      return <${componentName} {...props} style={style} />
    }

    ${framerName}.defaultProps = {
      width: 150,
      height: 50,
    }

    addPropertyControls(${framerName}, ${propertyControls.toJS()})
    `
}

export type EmitOptions = {
    packageName: string
    components: ComponentInfo[]
}

export async function emit({
    packageName,
    components,
}: EmitOptions): Promise<Array<{ fileName: string; outputSource: string }>> {
    const makePrettier = (code: string) => prettier.format(code, { parser: "typescript" })

    return components.map(comp => {
        return {
            fileName: comp.name + ".tsx",
            outputSource: makePrettier(generate(packageName, comp)),
        }
    })
}
