import * as React from "react"
import * as PropTypes from "prop-types"

export function SimpleReactComponent(props) {
    return <p>{props.text}</p>
}

SimpleReactComponent.defaultProps = {
    text: "Placeholder",
    num: 42,
    bool: true,
    fancyColor: "#0099ff",
}

SimpleReactComponent.propTypes = {
    text: PropTypes.string,
    num: PropTypes.number,
    bool: PropTypes.bool,
    fancyColor: PropTypes.string,
}
