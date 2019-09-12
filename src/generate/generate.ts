import prettier from "prettier"
import { ComponentInfo, EmitResult, PropertyControls, PropertyControl } from "../types"
import { flatMap, upperCaseFirstLetter } from "../utils"

function getPropertyControls(comp: ComponentInfo): PropertyControls {
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

    return propertyControls
}

function formatComponentName(comp: ComponentInfo) {
    return upperCaseFirstLetter(comp.name)
}

/** Emits the code for a framer component */
function generate(packageName: string, comp: ComponentInfo, additionalImports: string[]): string {
    const propertyControls = getPropertyControls(comp)

    const componentName = formatComponentName(comp)

    return `
    import * as React from "react"
    import * as System from "${packageName}"
    import { ControlType, PropertyControls, addPropertyControls } from "framer"
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

    addPropertyControls(${componentName},${propertyControls.toJS()})
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
