// @flow
import * as React from "react"
import type { Props } from "./externalPropTypes"

export const PropsTesterComponent = (props: Props) => {
    return <p>{props.toString()}</p>
}
