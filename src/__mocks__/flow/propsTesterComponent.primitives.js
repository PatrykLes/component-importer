// @flow

import * as React from "react"

type Props = {
    regularNumber: number,
    regularString: string,
    regularBoolean: boolean,
}

export const PropsTesterComponent = (props: Props) => {
    return <p>{props.toString()}</p>
}
