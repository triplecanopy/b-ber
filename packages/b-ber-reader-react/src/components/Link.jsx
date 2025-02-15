import React from 'react'
import { connect } from 'react-redux'
import ReaderContext from '../lib/reader-context'
import Url from '../helpers/Url'

// The Link component accounts for several different possibilities when directing
// users with relation to the publication and hosting domain

const Link = props => (
  <ReaderContext.Consumer>
    {({ getSpineItemByAbsoluteUrl, navigateToChapterByURL }) => {
      const { className, href, readerSettings, style, children } = props

      const nextClassName = className || ''
      const nextStyle = style || {}

      // Check if internal to publication. Verify by getting the spine item index
      // by the links href. In this case, default link behaviour is suppressed
      // and navigation is handled by b-ber routing logic
      const spineItemIndex = getSpineItemByAbsoluteUrl(href)
      const internalToPublication = spineItemIndex > -1

      // Check if the link is on the same domain that's hosting the project by comparing URLs.
      // In this case, the link will open in a new browser tab
      const externalToHost = Url.isExternal(href, window.location.href)

      // Check if the link is on the same host but outside of the publication. Check against the
      // projectUrl, a value that is either user-defined in the config file or inferred from the
      // manifestUrl, and that points to the host domain. In this case the link will open in the
      // current window
      const internalToHost = Url.isExternal(href, readerSettings.projectURL)

      let target = ''
      let rel = ''

      if (externalToHost && !internalToPublication) {
        target = '_blank'
        rel = 'nooperner noreferrer'
      } else if (internalToHost) {
        target = '_top'
      }

      return (
        <a
          href={href}
          target={target}
          rel={rel}
          style={nextStyle}
          className={nextClassName}
          onClick={e => {
            if (internalToPublication) {
              e.preventDefault()
              navigateToChapterByURL(href)
            }
          }}
        >
          {children}
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
