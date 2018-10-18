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
        const { href } = this.props
        return (
            <a
                href={href}
                onClick={e => {
                    e.preventDefault()
                    this.context.navigateToChapterByURL(href)
                }}
            >
                {this.props.children}
            </a>
        )
    }
}

export default Link
