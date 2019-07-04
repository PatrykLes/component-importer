// @ts-ignore
import * as React from "react"

type Props = {
    text: string
}

export default class SimpleReactComponent extends React.Component<Props> {
    render() {
        return <p>{props.text}</p>
    }
}
