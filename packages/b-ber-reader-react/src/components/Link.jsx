import React from 'react'
import { connect } from 'react-redux'
import ReaderContext from '../lib/reader-context'
import Url from '../helpers/Url'

// The Link component has to account for several different possibilities when
// handling hrefs; if a url is relative, if it's internal (same domain as the
// reader), hosted (same domain as the domain that the reader is hosted on, but
// the reader itself hosted elsewhere and embedded in an iframe), and external.

const Link = props => (
  <ReaderContext.Consumer>
    {({ navigateToChapterByURL }) => {
      const { className, style } = props

      const nextClassName = className || ''
      const nextStyle = style || {}

      const { href } = props
      const external = Url.isExternal(href, props.readerSettings.projectURL)
      const target = external ? '_blank' : '_top'
      const rel = external ? 'nooperner noreferrer' : ''

      return (
        <a
          href={href}
          target={target}
          rel={rel}
          style={nextStyle}
          className={nextClassName}
          onClick={e => {
            if (!external) {
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

// export default Link
export default connect(
  ({ readerSettings }) => ({ readerSettings }),
  () => ({})
)(Link)
