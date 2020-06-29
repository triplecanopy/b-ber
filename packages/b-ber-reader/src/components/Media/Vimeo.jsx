import React from 'react'
import omit from 'lodash/omit'
import ReactPlayer from 'react-player'
import has from 'lodash/has'
import VimeoPosterImage from './VimeoPosterImage'
import VimeoPlayerControls from './VimeoPlayerControls'
import withNodePosition from '../../lib/with-node-position'
import ReaderContext from '../../lib/reader-context'
import browser from '../../lib/browser'
import Url from '../../helpers/Url'
import Viewport from '../../helpers/Viewport'
import {
  getURLAndQueryParamters,
  getPlayerPropsFromQueryString,
  transformQueryParamsToProps,
  getPlayingStateOnUpdate,
} from '../../helpers/media'

// Chrome 81
// Conditional chaining for testing env
const isChrome81 =
  browser?.name === 'chrome' && browser?.version === '81.0.4044'

class Vimeo extends React.Component {
  static contextType = ReaderContext

  // Props that are on the vimeo player which must be managed by state
  static blacklistedProps = ['autopause' /* , 'controls' */]

  iframePlaceholder = React.createRef() // Chrome 81

  state = {
    url: '',
    loop: false, // Not sure why this needs to be duplicated on the ReactPlayer
    muted: false, // Not sure why this needs to be duplicated on the ReactPlayer
    controls: true, // TODO custom controls tbd
    playing: false,
    autoplay: true,
    posterImage: null,
    playerOptions: {},
    currentSpreadIndex: null,
    aspectRatio: new Map([
      ['x', 16],
      ['y', 9],
    ]),

    // There's a bug in Chrome 81.0.4044.92 that causes iframes on a different
    // domain than the host not to load in multiple column layouts. Following
    // props are used for element positioning in the work-around commened on
    // below.
    iframePlaceholderTop: 0,
    iframePlaceholderWidth: 0,
    iframePlaceholderHeight: 0,
  }

  UNSAFE_componentWillMount() {
    const { src, posterImage, aspectRatio } = this.props
    const [url, queryString] = getURLAndQueryParamters(src)

    let playerOptions = getPlayerPropsFromQueryString(queryString)

    playerOptions = transformQueryParamsToProps(playerOptions)

    // Extract autoplay property for use during page change events. Do this
    // after `transformQueryParamsToProps` to ensure boolean attrs
    const { autoplay, ...rest } = playerOptions

    // Controls is needed both in state and in playerOptions
    const { controls, muted, loop } = playerOptions

    this.setState({
      url,
      loop,
      muted,
      controls,
      autoplay,
      posterImage,
      aspectRatio,
      playerOptions: { ...rest },
    })

    window.addEventListener('resize', this.handleResize)
  }

  componentDidMount() {
    if (!isChrome81) return
    this.updateIframePosition() // Chrome 81
  }

  componentWillUnmount() {
    if (!isChrome81) return
    window.removeEventListener('resize', this.handleResize) // Chrome 81
  }

  handleResize = () => {
    if (!isChrome81) return
    this.updateIframePosition() // Chrome 81
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

  handleUpdatePlaying = () => this.setState({ playing: !this.state.playing })

  handlePause = () => this.setState({ playing: false })

  handleEnded = () => this.setState({ playing: false })

  handleUpdatePosition = () => {}

  handleUpdateVolume = () => {}

  transformQueryParamsToProps = props => {
    // Remove blacklisted props
    const options = omit(props, Vimeo.blacklistedProps)

    // Cast boolean attributes
    const truthy = new Set(['true', '1'])
    const falsey = new Set(['false', '0'])
    const bools = new Set([...truthy, ...falsey])

    const nextOptions = Object.entries(options).reduce((acc, [key, value]) => {
      acc[key] = bools.has(value) ? truthy.has(value) : value
      return acc
    }, {})

    // Set default controls
    if (!has(nextOptions, 'controls')) {
      nextOptions.controls = this.state.controls
    }

    // Autoplay on mobile
    nextOptions.playsinline = true

    return nextOptions
  }

  getPlayerPropsFromQueryString = queryString =>
    Url.parseQueryString(queryString)

  getURLAndQueryParamters = url => url.split('?')

  // Recursive call to update "floating" iframe position. The elements shift
  // around before render and can't be managed reliably in state, so poll the
  // placeholder position to check if the floating element's position matches,
  // and call again if not.
  updateIframePosition = () => {
    if (Viewport.isMobile()) return

    if (!this.iframePlaceholder?.current) {
      console.warn('Could not find iframePlaceholder node')
      return
    }

    const node = this.iframePlaceholder.current
    const {
      iframePlaceholderTop,
      iframePlaceholderWidth,
      iframePlaceholderHeight,
    } = this.state

    const { top, width, height } = node.getBoundingClientRect()

    if (
      iframePlaceholderTop !== top ||
      iframePlaceholderWidth !== width ||
      iframePlaceholderHeight !== height
    ) {
      this.setState({
        iframePlaceholderTop: top,
        iframePlaceholderWidth: width,
        iframePlaceholderHeight: height,
      })

      setTimeout(this.updateIframePosition, 60)
    }
  }

  render() {
    const {
      url,
      loop,
      muted,
      controls,
      playing,
      posterImage,
      playerOptions,
      aspectRatio,

      // Chrome 81
      iframePlaceholderTop: top,
      iframePlaceholderWidth: width,
      iframePlaceholderHeight: height,
    } = this.state

    // Chrome 81
    let iframeContainerStyles = {}
    let paddingTop

    if (isChrome81) {
      const mobile = Viewport.isMobile()
      const position = mobile ? 'static' : 'absolute' // Only run re-positioning on desktop
      const x = aspectRatio.get('x')
      const y = aspectRatio.get('y')

      // Styles for inline videos
      if (!mobile) iframeContainerStyles = { top, width, height, position }

      // Styles for fullscreen videos
      if (!mobile && width > window.innerWidth) {
        const landscape = window.innerWidth >= window.innerHeight

        iframeContainerStyles.top = '50%'
        iframeContainerStyles.left = '50%'
        iframeContainerStyles.transform = 'translateX(-50%) translateY(-50%)'

        if (landscape) {
          iframeContainerStyles.width = '100vw'
          iframeContainerStyles.height = '100vw'
          iframeContainerStyles.minWidth = `${(x / y) * 100}vh`
        } else {
          iframeContainerStyles.width = `${(y / x) * 100}vw`
          iframeContainerStyles.height = '100vw'
          iframeContainerStyles.minHeight = '100%'
        }
      }

      // .iframe-placeholder styles
      paddingTop = mobile ? 0 : `${(y / x) * 100}%`
    }

    return (
      <React.Fragment>
        {/*
            The iframePlaceholder element is a statically positioned div that
            fills the space that should be occupied by the ReactPlayer iframe.
            The iframe is absolutely positioned and is set to top and left
            positions of the placeholder. This is to address a bug in Chrome 81
            that prevents iframes from loading in multiple column layouts.

            The parent container also needs to be styled to properly render the
            layout. Inject inline styles here.
        */
        isChrome81 && (
          <style>{`
            .context__desktop .vimeo.figure__large.figure__inline .embed.supported {
              padding-top: 0 !important;
              position: static !important;
              transform: none !important;
            }

            .context__desktop .spread-with-fullbleed-media .vimeo.figure__large.figure__inline .embed.supported {
              position: relative !important;
            }

            .context__desktop .spread-with-fullbleed-media .vimeo.figure__large.figure__inline .embed.supported iframe,
            .context__desktop .spread-with-fullbleed-media .vimeo.figure__large.figure__inline .embed.supported .iframe-placeholder + div {
              top: 0 !important;
            }
          `}</style>
        )}

        {isChrome81 && (
          <div
            key={`placholder-${url}`}
            style={{ paddingTop }}
            className="iframe-placeholder"
            ref={this.iframePlaceholder}
          />
        )}

        {/* Ref is used to calculate spread position in HOC */}
        <div style={iframeContainerStyles} key={url} ref={this.props.elemRef}>
          <VimeoPosterImage
            src={posterImage}
            playing={playing}
            controls={controls}
            handleUpdatePlaying={this.handleUpdatePlaying}
          />
          <ReactPlayer
            url={url}
            width="100%"
            height="100%"
            loop={loop}
            muted={muted}
            playing={playing}
            controls={controls}
            playsinline={true}
            config={{ vimeo: playerOptions }}
            onPause={this.handlePause}
            onEnded={this.handleEnded}
          />
          <VimeoPlayerControls
            handleUpdatePlaying={this.handleUpdatePlaying}
            handleUpdatePosition={this.handleUpdatePosition}
            handleUpdateVolume={this.handleUpdateVolume}
          />
        </div>
      </React.Fragment>
    )
  }
}

export default withNodePosition(Vimeo, { useParentDimensions: true })
