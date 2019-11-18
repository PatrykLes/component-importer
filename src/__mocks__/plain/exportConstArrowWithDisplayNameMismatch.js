import * as React from "react"
import * as PropTypes from "prop-types"

export const SimpleReactComponent = props => {
    return <p>{props.text}</p>
}

SimpleReactComponent.displayName = "Simple-React-Component"

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
