import * as React from "react"
import { MocksProps } from "./type"

export default class SimpleReactComponent extends React.Component<MocksProps> {
    render() {
        return <p>{this.props.text}</p>
    }
}
