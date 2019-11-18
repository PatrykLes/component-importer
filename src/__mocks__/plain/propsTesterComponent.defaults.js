import * as React from "react"
import * as PropTypes from "prop-types"

export const PropsTesterComponent = props => {
    return <p>{props.toString()}</p>
}

PropsTesterComponent.propTypes = {
    num: PropTypes.number,
    text: PropTypes.string,
    computedProp: PropTypes.number,
    arr: PropTypes.arrayOf(PropTypes.string)
}

PropsTesterComponent.defaultProps = {
    num: 42,
    text: "Placeholder",
    computedProp: Number.MAX_SAFE_INTEGER,
    arr: ["a", "b", "c"]
}
