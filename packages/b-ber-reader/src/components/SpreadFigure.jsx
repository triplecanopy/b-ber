import React from 'react'
import PropTypes from 'prop-types'

class SpreadFigure extends React.Component {
    static contextTypes = {
        left: PropTypes.string,
        // transform: PropTypes.string,
        // recto: PropTypes.bool,
        // verso: PropTypes.bool,
    }

    render() {
        const { children, ...rest } = this.props
        const { left } = this.context

        return (
            <figure style={{ left }} {...rest}>
                {children}
            </figure>
        )
    }
}

export default SpreadFigure
