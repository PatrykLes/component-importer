// @ts-ignore
import * as React from "react"

type Props = {
    text: string
}

export const SimpleReactComponent: React.SFC<Props> = props => {
    return <p>{props.text}</p>
}
