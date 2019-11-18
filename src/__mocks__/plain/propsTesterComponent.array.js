import * as React from "react"
import * as PropTypes from "prop-types"

export const PropsTesterComponent = props => {
    return <p>{props.toString()}</p>
}

PropsTesterComponent.propTypes = {
    numberArray: PropTypes.arrayOf(PropTypes.number),
    stringArray: PropTypes.arrayOf(PropTypes.string),
}
