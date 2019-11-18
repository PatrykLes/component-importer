import * as React from "react"
import * as PropTypes from "prop-types"

export const PropsTesterComponent = props => {
    return <p>{props.toString()}</p>
}

PropsTesterComponent.propTypes = {
    mixedEnum: PropTypes.oneOf([1, "what", 3]),
    booleanMix: PropTypes.oneOf([true, "a", "b", false]),
    primitiveMix: PropTypes.oneOfType([PropTypes.string, PropTypes.bool, PropTypes.number]),
    stringMixWithExtras: PropTypes.oneOf(["a", "b", "c", { foo: "1" }]),
}
