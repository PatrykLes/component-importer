import * as React from "react"
import * as PropTypes from "prop-types"

export const PropsTesterComponent = props => {
    return <p>{props.toString()}</p>
}

PropsTesterComponent.propTypes = {
    regularNumber: PropTypes.number,
    regularString: PropTypes.string,
    regularBoolean: PropTypes.bool,
}
