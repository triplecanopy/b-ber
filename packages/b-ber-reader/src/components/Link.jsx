import React, { Component } from 'react'
import PropTypes from 'prop-types'
import Url from '../helpers/Url'

class Link extends Component {
    static contextTypes = {
        spreadIndex: PropTypes.number,
        navigateToChapterByURL: PropTypes.func,
    }
    render() {
        const { className, style, href } = this.props
        return (
            <a
                href={href}
                style={style || {}}
                className={className || ''}
                onClick={e => {
                    e.preventDefault()
                    if (Url.isExternalURL(href)) {
                        window.top.location.href = href
                        return
                    }

                    this.context.navigateToChapterByURL(href)
                }}
            >
                {this.props.children}
            </a>
        )
    }
}

export default Link
