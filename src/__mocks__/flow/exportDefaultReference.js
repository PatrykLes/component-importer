// @flow

import * as React from "react"

type Props = {
    text: string,
    num: number,
    bool: boolean,
    fancyColor: string,
}

const PrivateComponent = (props: Props) => {
    return <p>{props.text}</p>
}

const SimpleReactComponent = (props: Props) => {
    return (
        <p>
            <PrivateComponent {...props} />
        </p>
    )
}

SimpleReactComponent.defaultProps = {
    text: "Placeholder",
    num: 42,
    bool: true,
    fancyColor: "#0099ff",
}

export default SimpleReactComponent
