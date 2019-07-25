namespace PropertyControls {
    type ColorControlDefinition = {
        title?: string
        defaultValue?: string
    }

    type NumberControlDefinition = {
        title?: string
        defaultValue?: number
    }

    type BooleanControlDefinition = {
        title?: string
        defaultValue?: boolean
    }

    export type Number<T extends NumberControlDefinition> = number

    export type Color<T extends ColorControlDefinition> = string

    export type Boolean<T extends BooleanControlDefinition> = boolean
}

import * as React from "react"

type Props = {
    color: PropertyControls.Color<{ defaultValue: "red" }>
}

export function Button(props: Props) {
    return <p>{props.color}</p>
}
