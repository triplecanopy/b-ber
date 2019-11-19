import React, { Component } from 'react'
import PropTypes from 'prop-types'
import Url from '../helpers/Url'

// the Link component has to account for several different possibilities when
// handling href, if a url is relative, if it's internal (same domain as the
// reader), hosted (same domain as the domain that the reader is hosted on, but
// the reader itself hosted elsewhere and embedded in an iframe), and external.

class Link extends Component {
  static contextTypes = {
    spreadIndex: PropTypes.number,
    navigateToChapterByURL: PropTypes.func,
  }

  render() {
    const { className, style, href } = this.props
    const target = Url.isExternal(href) ? '_blank' : '_top'

    return (
      <a
        href={href}
        style={style || {}}
        className={className || ''}
        target={target}
        onClick={e => {
          if (Url.isRelative(href) || Url.isInternal(href)) {
            e.preventDefault()
            this.context.navigateToChapterByURL(href)
          }
        }}
      >
        {this.props.children}
      </a>
    )
  }
}

export default Link
