import React from 'react'
import withNodePosition from '../../lib/with-node-position'
import withIframePosition from '../../lib/with-iframe-position'
import ReaderContext from '../../lib/reader-context'
import Viewport from '../../helpers/Viewport'
import { isBrowser } from '../../helpers/utils'

// Enable absolutely positioned iframe layout for specific browsers/versions
const iframePositioningEnabled = isBrowser('chrome', 'eq', 81)

class Iframe extends React.Component {
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
      attrs,
      viewerSettings,
      iframePlaceholderTop,
      iframePlaceholderWidth,
    } = this.props

    const { src, title, width, height } = attrs

    let iframeContainerStyles = {}

    // Set styles for absolutely positioned desktop elements for browser
    // behaviour
    if (iframePositioningEnabled) {
      const mobile = Viewport.isSingleColumn(viewerSettings)
      const position = mobile ? 'static' : 'absolute' // Only run re-positioning on desktop

      iframeContainerStyles = {
        top: iframePlaceholderTop,
        width,
        maxWidth: mobile ? '100%' : iframePlaceholderWidth,
        position,
      }
    }

    return (
      <>
        {/* Styles for iframe layout */}
        {iframePositioningEnabled && (
          <style>{this.props.iframeStyleBlock('iframe')}</style>
        )}

        {/* See Vimeo.jsx for details about the iframe-placeholder element */}
        {iframePositioningEnabled && (
          <div
            key={`placholder-${src}`}
            style={{ paddingTop: height }}
            className="bber-iframe-placeholder"
            ref={this.props.innerRef}
          />
        )}

        <div style={iframeContainerStyles} key={src} ref={this.props.elemRef}>
          <iframe
            src={src}
            title={title}
            // eslint-disable-next-line react/jsx-props-no-spreading
            {...attrs}
          />
        </div>
      </>
    )
  }
}

export default withNodePosition(
  withIframePosition(Iframe, { enabled: iframePositioningEnabled })
)
