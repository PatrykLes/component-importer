import * as React from "react"
import { MocksProps } from "./type"

export const SimpleReactComponent = (props: MocksProps) => {
    return <p>{props.text}</p>
}
