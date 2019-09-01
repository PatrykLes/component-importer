import prettier from "prettier"
import { ComponentInfo, EmitResult } from "../types"
import { flatMap } from "../utils"

/** Emits the code for a framer component */
function generate(packageName: string, comp: ComponentInfo, additionalImports: string[]): string {
    const { componentName, propertyControls } = comp

    const controls = propertyControls.items
        .map(item => {
            return `${item.name}: merge(controls.${item.name}, {})`
        })
        .join(",\n")

    return `
    import * as React from "react"
    import * as System from "${packageName}"
    import { ControlType, PropertyControls, addPropertyControls } from "framer"
    import { controls, merge } from "./generated/${componentName}"
    import { withHOC } from "./withHOC"
    ${additionalImports.join("\n")}

    const style: React.CSSProperties = {
      width: "100%",
      height: "100%",
    }

    const Inner${componentName}: React.SFC = props => {
      return <System.${componentName} {...props} style={style} />
    }

    export const ${componentName} = withHOC(Inner${componentName});

    ${componentName}.defaultProps = {
      width: 150,
      height: 50,
    }

    addPropertyControls(${componentName},{
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

function generateHOC() {
    return `
    import * as React from "react"

    export function withHOC(Component): React.SFC {
        return (props: any) => {
          return (
              <Component {...props} />
          );
        };
      }

    `
}

export type EmitOptions = {
    packageName: string
    components: ComponentInfo[]
    additionalImports: string[]
}

export async function emitComponents({
    packageName,
    components,
    additionalImports,
}: EmitOptions): Promise<EmitResult[]> {
    const makePrettier = (code: string) => prettier.format(code, { parser: "typescript" })

    return [
        ...flatMap(
            components,
            (comp: ComponentInfo): EmitResult[] => {
                return [
                    {
                        type: "inferredControls",
                        fileName: `generated/${comp.name}.ts`,
                        outputSource: makePrettier(generateInferredPropertyControls(comp)),
                    },
                    {
                        type: "component",
                        fileName: comp.name + ".tsx",
                        outputSource: makePrettier(generate(packageName, comp, additionalImports)),
                    },
                ]
            },
        ),
        {
            type: "hoc",
            fileName: "withHOC.tsx",
            outputSource: makePrettier(generateHOC()),
        },
    ]
}
