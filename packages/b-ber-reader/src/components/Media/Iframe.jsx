import React from 'react'
import withNodePosition from '../../lib/with-node-position'
import withIframePosition from '../../lib/with-iframe-position'
import ReaderContext from '../../lib/reader-context'
import Viewport from '../../helpers/Viewport'
import { isBrowser } from '../../helpers/utils'

// Enable absolutely positioned iframe layout for specific browsers/versions
const iframePositioningEnabled = isBrowser('chrome', 'gte', 81)

class Soundcloud extends React.Component {
  static contextType = ReaderContext

  componentDidMount() {
    window.addEventListener('blur', this.focusWindow)
  }

  componentWillUnmount() {
    window.removeEventListener('blur', this.focusWindow)
  }

  // Prevent iframe from stealing focus
  focusWindow = () => setTimeout(() => window.focus(), 60)

  render() {
    const {
      src,
      title,
      height,
      iframePlaceholderTop,
      iframePlaceholderWidth,
    } = this.props

    let { width } = this.props

    let iframeContainerStyles = {}
    // let width = '100%'

    // Set styles for absolutely positioned desktop elements for browser
    // behaviour
    if (iframePositioningEnabled) {
      const mobile = Viewport.isMobile()
      const position = mobile ? 'static' : 'absolute' // Only run re-positioning on desktop

      iframeContainerStyles = {
        top: iframePlaceholderTop,
        width: iframePlaceholderWidth,
        position,
      }

      width = iframePlaceholderWidth
    }

    // TODO set default height for tracks and playlists. tracks currently 150px,
    // playlists are 50% frame height
    // const height = 150
    // let height = 150
    // if (kind === 'playlists' || kind === 'users') {
    //   const { top, bottom } = Viewport.optimized()
    //   height = (window.innerHeight - top - bottom) / 2
    // }

    return (
      <React.Fragment>
        {/* Styles for iframe layout */}
        {iframePositioningEnabled && (
          <style>{this.props.iframeStyleBlock()}</style>
        )}

        {/* See Vimeo.jsx for details about the iframe-placeholder element */}
        {iframePositioningEnabled && (
          <div
            key={`placholder-${src}`}
            style={{ paddingTop: height }}
            className="iframe-placeholder"
            ref={this.props.innerRef}
          />
        )}

        <div style={iframeContainerStyles} key={src} ref={this.props.elemRef}>
          <iframe
            src={src}
            title={title}
            width={width}
            height={height}
            webkitallowfullscreen="webkitallowfullscreen"
            mozallowfullscreen="mozallowfullscreen"
            allowFullscreen="allowfullscreen"
            allow="autoplay"
            frameBorder="0"
            scrolling="no"
          />
        </div>
      </React.Fragment>
    )
  }
}

export default withNodePosition(
  withIframePosition(Soundcloud, { enabled: iframePositioningEnabled })
)
