import * as React from "react"
import * as PropTypes from "prop-types"

export const PropsTesterComponent = props => {
    return <p>{props.toString()}</p>
}

PropsTesterComponent.propTypes = {
    regularNumberEnum: PropTypes.oneOf([1, 2, 3]),
    regularStringEnum: PropTypes.oneOf(["a", "b", "c"]),
}
