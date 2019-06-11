import { ComponentInfo, ProcessedFile } from "./types"

/** Emits the code of all components found in a processed file */
export function generateFile(analyzedFile: ProcessedFile): string {
    const sb = []
    for (const comp of analyzedFile.components) {
        sb.push(generate(comp))
    }
    return sb.join("")
}

/** Emits the code for a framer component */
export function generate(comp: ComponentInfo): string {
    const sb = []
    const { componentName, framerName, propertyControls } = comp
    sb.push(`
    import * as React from "react"
    import * as System from "../../design-system"
    import { ControlType, PropertyControls } from "framer"
    
    type Props = ${componentName}Props & {
      width: number
      height: number
    }
    
    export class ${framerName} extends React.Component<Props> {
      render() {
        return <${componentName} {...this.props} />
      }
    
      static defaultProps: Props = {
        width: 150,
        height: 50,
      }
    
      static propertyControls: PropertyControls<Props> = ${propertyControls.toJS()}
    }
    `)
    return sb.join("")
}
