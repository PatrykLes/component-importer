import * as React from "react"
import { MocksProps } from "./type"

export let SimpleReactComponent: React.SFC<MocksProps> = props => {
    return <p>{props.text}</p>
}
