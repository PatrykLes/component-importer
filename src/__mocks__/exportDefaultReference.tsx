import * as React from "react"
import { MocksProps } from "./type"

const PrivateComponent: React.SFC<MocksProps> = props => {
    return <p>{props.text}</p>
}

const SimpleReactComponent: React.SFC<MocksProps> = props => {
    return (
        <p>
            <PrivateComponent {...props} />
        </p>
    )
}

export default SimpleReactComponent
