import * as React from "react"

type Props = {
    // perfect matches
    regularNumber: number
    regularString: string
    regularBoolean: boolean
}

export const PropsTesterComponent: React.SFC<Props> = props => {
    return <p>{props.toString()}</p>
}
