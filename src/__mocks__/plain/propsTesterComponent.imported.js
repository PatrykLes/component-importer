import * as React from "react"
import { propTypes } from "./externalPropTypes"

export const PropsTesterComponent = props => {
    return <p>{props.toString()}</p>
}

PropsTesterComponent.propTypes = propTypes
