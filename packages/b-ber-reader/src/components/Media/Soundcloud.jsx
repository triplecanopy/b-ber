import React from 'react'
import ReactPlayer from 'react-player'
import withNodePosition from '../../lib/with-node-position'
import withIframePosition from '../../lib/with-iframe-position'
import ReaderContext from '../../lib/reader-context'
import Viewport from '../../helpers/Viewport'
import {
  getURLAndQueryParamters,
  getPlayerPropsFromQueryString,
  transformQueryParamsToProps,
  getPlayingStateOnUpdate,
} from '../../helpers/media'
import { isBrowser } from '../../helpers/utils'

// Enable absolutely positioned iframe layout for specific browsers/versions
const iframePositioningEnabled = isBrowser('chrome', 'gte', 81)

class Soundcloud extends React.Component {
  static contextType = ReaderContext

  state = {
    url: '',
    // controls: true, // TODO custom controls tbd
    playing: false,
    autoplay: false,
    options: {},
    currentSpreadIndex: null,
  }

  UNSAFE_componentWillMount() {
    const { src } = this.props

    const queryString = getURLAndQueryParamters(src)[1]
    const options = transformQueryParamsToProps(
      getPlayerPropsFromQueryString(queryString)
    )

    // Extract autoplay property for use during page change events. Do this
    // after `transformQueryParamsToProps` to ensure boolean attrs
    const { url, autoplay, ...rest } = options

    // Controls is needed both in state and in options
    // const { controls } = options

    this.setState({ url, autoplay, options: rest })
  }

  UNSAFE_componentWillReceiveProps(nextProps, nextContext) {
    const nextState = getPlayingStateOnUpdate(
      this.state,
      this.props,
      nextProps,
      nextContext
    )

    if (!nextState) return

    this.setState(nextState)
  }

  componentDidMount() {
    window.addEventListener('blur', this.focusWindow)
  }

  componentWillUnmount() {
    window.removeEventListener('blur', this.focusWindow)
  }

  // Prevent iframe from stealing focus
  focusWindow = () => setTimeout(() => window.focus(), 60)

  handlePause = () => this.setState({ playing: false })

  handleEnded = () => this.setState({ playing: false })

  render() {
    const {
      /*controls, */
      url,
      playing,
      options,
    } = this.state

    const { iframePlaceholderTop, iframePlaceholderWidth } = this.props

    let iframeContainerStyles = {}
    let width = '100%'

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

    const { kind } = this.props

    // TODO set default height for tracks and playlists. tracks currently 150px,
    // playlists are 50% frame height
    let height = 150
    if (kind === 'playlists' || kind === 'users') {
      const { top, bottom } = Viewport.optimized()
      height = (window.innerHeight - top - bottom) / 2
    }

    return (
      <React.Fragment>
        {/* Styles for iframe layout */}
        {iframePositioningEnabled && (
          <style>{this.props.iframeStyleBlock('soundcloud')}</style>
        )}

        {/* See Vimeo.jsx for details about the iframe-placeholder element */}
        {iframePositioningEnabled && (
          <div
            key={`placholder-${url}`}
            style={{ paddingTop: height }}
            className="iframe-placeholder"
            ref={this.props.innerRef}
          />
        )}

        <div style={iframeContainerStyles} key={url} ref={this.props.elemRef}>
          <ReactPlayer
            url={url}
            width={width}
            height={height}
            playing={playing}
            playsinline={true}
            config={{ soundcloud: { options } }}
            // controls={controls}
            onPause={this.handlePause}
            onEnded={this.handleEnded}
          />
        </div>
      </React.Fragment>
    )
  }
}

export default withNodePosition(
  withIframePosition(Soundcloud, { enabled: iframePositioningEnabled })
)
