import * as React from "react"

type Props = {
    mixedEnum: 1 | "what" | 3
    complexMix: "small" | { width: number }
    booleanMix: true | "a" | "b" | false | 1
    primitiveMix: string | boolean | number
    stringMixWithExtras: "a" | "b" | "c" | { foo: "1" } | string
}

export const PropsTesterComponent: React.SFC<Props> = props => {
    return <p>{props.toString()}</p>
}
