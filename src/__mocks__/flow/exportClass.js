// @flow

import * as React from "react"

type Props = {
    text: string,
    num: number,
    bool: boolean,
    fancyColor: string,
}

export class SimpleReactComponent extends React.Component<Props> {
    render() {
        return <p>{this.props.text}</p>
    }
}

SimpleReactComponent.defaultProps = {
    text: "Placeholder",
    num: 42,
    bool: true,
    fancyColor: "#0099ff",
}
