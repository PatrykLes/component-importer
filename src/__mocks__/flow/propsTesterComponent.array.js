// @flow

import * as React from "react"

type Props = {
    numberArray: number[],
    stringArray: string[],
}

export const PropsTesterComponent = (props: Props) => {
    return <p>{props.toString()}</p>
}
