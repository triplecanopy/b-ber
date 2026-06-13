import React from 'react'
import { isBrowser } from '../../helpers/utils'
import Viewport from '../../helpers/Viewport'
import ReaderContext from '../../lib/reader-context'
import withIframePosition from '../../lib/with-iframe-position'
import withNodePosition from '../../lib/with-node-position'

// Enable absolutely positioned iframe layout for specific browsers/versions
const iframePositioningEnabled = isBrowser('chrome', 'eq', 81)

interface IframeAttrs {
  src?: string
  title?: string
  width?: string | number
  height?: string | number
  [key: string]: any
}

interface IframeProps {
  attrs: IframeAttrs
  // Redux slice + position props injected by the HOC chain.
  viewerSettings?: any
  iframePlaceholderTop?: number
  iframePlaceholderWidth?: number
  iframeStyleBlock: (name?: string) => string
  innerRef?: (ref: HTMLDivElement | null) => void
  elemRef?: React.Ref<HTMLDivElement>
  [key: string]: any
}

class Iframe extends React.Component<IframeProps> {
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

    let iframeContainerStyles: React.CSSProperties = {}

    // Set styles for absolutely positioned desktop elements for browser
    // behaviour
    if (iframePositioningEnabled) {
      // Viewport.isSingleColumn ignores its argument; the original JS passed
      // viewerSettings, preserved here via a cast.
      const mobile = (Viewport.isSingleColumn as any)(viewerSettings)
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

        {/* See Vimeo.tsx for details about the iframe-placeholder element */}
        {iframePositioningEnabled && (
          <div
            key={`placholder-${src}`}
            style={{ paddingTop: height }}
            className="bber-iframe-placeholder"
            ref={this.props.innerRef}
          />
        )}

        <div style={iframeContainerStyles} key={src} ref={this.props.elemRef}>
          <iframe src={src} title={title} {...attrs} />
        </div>
      </>
    )
  }
}

export default withNodePosition(
  withIframePosition(Iframe, { enabled: iframePositioningEnabled })
)
