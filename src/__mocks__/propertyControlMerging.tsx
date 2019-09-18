import * as React from "react"
// @ts-ignore
import { addPropertyControls, ControlType } from "framer"

/**
 * this is a comment
 */
export const SimpleReactComponent = props => {
    return <p>test</p>
}

/**
 * these are also comments
 */
addPropertyControls(SimpleReactComponent, {
    text: { type: ControlType.String },
    num: { type: ControlType.Number },
    bool: { type: ControlType.Boolean },
})
