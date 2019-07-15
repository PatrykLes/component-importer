import * as React from "react"

type Props = {
    regularNumberEnum: 1 | 2 | 3
    regularStringEnum: "a" | "b" | "c"
}

export const PropsTesterComponent: React.SFC<Props> = props => {
    return <p>{props.toString()}</p>
}
