import prettier from "prettier"
import { ComponentInfo, EmitResult } from "../types"
import { flatMap, upperCaseFirstLetter } from "../utils"

function formatComponentName(comp: ComponentInfo) {
    return upperCaseFirstLetter(comp.name)
}

/** Emits the code for a framer component */
function generate(packageName: string, comp: ComponentInfo, additionalImports: string[]): string {
    const { propertyControls } = comp

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
