import * as React from "react"

type Props = {
    mixedEnum: 1 | "what" | 3
    complexMix: "small" | { width: number }
    booleanMix: true | "a" | "b" | false | 1
}

export const PropsTesterComponent: React.SFC<Props> = props => {
    return <p>{props.toString()}</p>
}
