import React from 'react'
import ReaderContext from '../lib/reader-context'
import Url from '../helpers/Url'

// The Link component has to account for several different possibilities when
// handling hrefs; if a url is relative, if it's internal (same domain as the
// reader), hosted (same domain as the domain that the reader is hosted on, but
// the reader itself hosted elsewhere and embedded in an iframe), and external.

const Link = props => (
  <ReaderContext.Consumer>
    {({ navigateToChapterByURL }) => {
      let { className, style } = props

      className = className || ''
      style = style || {}

      const { href } = props
      const target = Url.isExternal(href) ? '_blank' : '_top'
      // TODO add rel="nooperner noreferrer"

      return (
        <a
          href={href}
          style={style}
          target={target}
          className={className}
          onClick={e => {
            if (Url.isRelative(href) || Url.isInternal(href)) {
              e.preventDefault()
              navigateToChapterByURL(href)
            }
          }}
        >
          {props.children}
        </a>
      )
    }}
  </ReaderContext.Consumer>
)

export default Link
