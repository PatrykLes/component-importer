// @ts-ignore
import * as React from "react"

type Props = {
    text: string
}

export const SimpleReactComponent: React.SFC = (props: Props) => {
    return <p>{props.text}</p>
}
