// @ts-ignore
import * as React from "react"

type Props = {
    text: string
}

const SimpleReactComponent: React.SFC<Props> = (props: Props) => {
    return <p>{props.text}</p>
}

export default SimpleReactComponent
