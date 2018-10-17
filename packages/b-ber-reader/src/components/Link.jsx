import React, { Component } from 'react'
import PropTypes from 'prop-types'

class Link extends Component {
    static contextTypes = {
        spreadIndex: PropTypes.number,
        navigateToChapterByURL: PropTypes.func,
    }
    constructor(props) {
        super(props)
    }
    render() {
        return (
            <a
                href={this.props.href}
                onClick={e => {
                    e.preventDefault()
                    this.context.navigateToChapterByURL(this.props.href)
                }}
            >
                {this.props.children}
            </a>
        )
    }
}

export default Link
