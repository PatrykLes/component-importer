import * as React from "react"
import { MocksProps } from "./type"

export class SimpleReactComponent extends React.Component<MocksProps> {
    render() {
        return <p>{this.props.text}</p>
    }
}
