import * as React from "react"
import { MocksProps } from "./type"

export function SimpleReactComponent(props: MocksProps) {
    return <p>{props.text}</p>
}
