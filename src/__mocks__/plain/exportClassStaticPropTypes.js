import * as React from "react"
import * as PropTypes from "prop-types"

export class SimpleReactComponent extends React.Component {
    static propTypes = {
        text: PropTypes.string,
        num: PropTypes.number,
        bool: PropTypes.bool,
        fancyColor: PropTypes.string,
    }

    static defaultProps = {
        text: "Placeholder",
        num: 42,
        bool: true,
        fancyColor: "#0099ff",
    }

    render() {
        return <p>{this.props.text}</p>
    }
}
