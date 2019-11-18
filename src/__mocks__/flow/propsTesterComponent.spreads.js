// @flow

import * as React from "react"

type InnerProps = {
    regularNumber: number,
    regularString: string,
    regularBoolean: boolean,
}

type Props = {
    ...InnerProps,
}

export const PropsTesterComponent = (props: Props) => {
    return <p>{props.toString()}</p>
}
