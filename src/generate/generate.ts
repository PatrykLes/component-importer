import prettier from "prettier"
import { ComponentEmitInfo, EmitResult, Formatter } from "../types"
import { printExpression, upperCaseFirstLetter } from "../utils"
import { createPropertyControlObjectExpression } from "./conversion"

function formatComponentName(comp: ComponentEmitInfo) {
    return upperCaseFirstLetter(comp.name)
}

/** Emits the code for a framer component */
function generate(packageName: string, comp: ComponentEmitInfo, additionalImports: string[]): string {
    const propertyControls = printExpression(createPropertyControlObjectExpression(comp))

    const componentName = formatComponentName(comp)

    return `
    import * as React from "react"
    import * as System from "${packageName}"
    import { ControlType, PropertyControls, addPropertyControls } from "framer"
    import { withHOC } from "./withHOC"
    ${additionalImports.join("\n")}

    const Inner${componentName} = props => {
      return <System.${componentName} {...props}></System.${componentName}>
    }

    export const ${componentName} = withHOC(Inner${componentName});

    ${componentName}.defaultProps = {
      width: 150,
      height: 50,
    }

    addPropertyControls(${componentName},${propertyControls})
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
    formatter: Formatter
    packageName: string
    components: ComponentEmitInfo[]
    additionalImports: string[]
}

export function emitComponents({ formatter, packageName, components, additionalImports }: EmitOptions): EmitResult[] {
    const emitResults: EmitResult[] = components
        .filter(comp => comp.emit)
        .map(comp => {
            return {
                type: "component",
                emitPath: comp.emitPath,
                outputSource: formatter(generate(packageName, comp, additionalImports)),
            }
        })

    return [
        ...emitResults,
        {
            type: "hoc",
            fileName: "withHOC.tsx",
            outputSource: formatter(generateHOC()),
        },
    ]
}
