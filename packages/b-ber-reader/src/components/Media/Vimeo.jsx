import React from 'react'
import omit from 'lodash/omit'
import classNames from 'classnames'
import ReactPlayer from 'react-player'
import has from 'lodash/has'
import withNodePosition from '../../lib/with-node-position'
import ReaderContext from '../../lib/reader-context'
// import DeferredContext from '../../lib/deferred-context'
import browser from '../../lib/browser'
import Url from '../../helpers/Url'
import Viewport from '../../helpers/Viewport'

// Chrome 81
// Conditional chaining for testing env
const isChrome81 =
  browser?.name === 'chrome' && browser?.version === '81.0.4044'

const VimeoPosterImage = ({ src, playing, controls, handleUpdatePlaying }) => {
  if (!src) return null

  return (
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events,jsx-a11y/no-noninteractive-element-interactions
    <img
      className={classNames('poster poster--vimeo', {
        // Don't show poster image if the video is playing
        visible: !playing,
        // Disable pointer-events on the poster image if using native controls
        // and the video is playing
        controls,
      })}
      onClick={handleUpdatePlaying}
      src={src}
      alt=""
    />
  )
}

// TODO this will implement/be replaced with Media/Controls components
const VimeoPlayerControls = (/*
  {
    handleUpdatePlaying,
    handleUpdatePosition,
    handleUpdateVolume,
  }
*/) =>
  null

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
    // willPlayOnReady: false,
    aspectRatio: new Map([
      ['x', 16],
      ['y', 9],
    ]),

    // There's a bug in Chrome 81.0.4044.92 that causes iframes on a different
    // domain than the host not to load in multiple column layouts. Following
    // props are used for element positioning in the work-around commened on
    // below.
    iframePlaceholderTop: 0,
    iframePlaceholderLeft: 0,
    iframePlaceholderWidth: 0,
    iframePlaceholderHeight: 0,
  }

  componentWillMount() {
    const { src, posterImage, aspectRatio } = this.props
    const [url, queryString] = this.getVimeoURLAndQueryParamters(src)

    let playerOptions = this.getReactPlayerPropsFromQueryStringParameters(
      queryString
    )

    playerOptions = this.transformVimeoProps(playerOptions)

    // Extract autoplay property for use during page change events. Do this
    // after `transformVimeoProps` to ensure boolean attrs
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

  componentWillReceiveProps(nextProps, nextContext) {
    // Only elements with an autoplay attribute
    if (!this.state.autoplay) return // console.log('no auto')

    // Only if the view is fully rendered
    if (!nextProps.view.loaded) return // console.log('not loaded')

    let { currentSpreadIndex } = this.state

    // The index that the element is rendered on as calculated by withNodePosition
    const { spreadIndex: elementSpreadIndex } = this.props

    // The spread index that's currently in view
    const { spreadIndex: visibleSpreadIndex } = nextContext

    // Only if user is navigating to a new spread
    if (currentSpreadIndex === visibleSpreadIndex) {
      // return console.log('not navigating')
      return
    }

    // Update the `currentSpreadIndex` so that the user can continue to interact
    // with the video (play/pause) as normal
    currentSpreadIndex = visibleSpreadIndex

    // Play or pause the video. If `elementSpreadIndex`
    const playing = elementSpreadIndex === visibleSpreadIndex

    // spreadIndex: 0, lastSpread: true
    console.log(
      `elementSpreadIndex: ${elementSpreadIndex}`,
      `visibleSpreadIndex: ${visibleSpreadIndex}`,
      `currentSpreadIndex: ${currentSpreadIndex}`,
      `playing: ${playing}`
      // this.context,
      // nextContext
    )

    this.setState({ playing, currentSpreadIndex })
  }

  handleUpdatePlaying = () =>
    this.setState(state => ({ ...state, playing: !state.playing }))

  handlePause = () => this.setState(state => ({ ...state, playing: false }))

  handleEnded = () => this.setState(state => ({ ...state, playing: false }))

  handleUpdatePosition = () => {}

  handleUpdateVolume = () => {}

  transformVimeoProps = props => {
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

  getReactPlayerPropsFromQueryStringParameters = queryString =>
    Url.parseQueryString(queryString)

  getVimeoURLAndQueryParamters = url => url.split('?')

  // Recursive call to update "floating" iframe position. The elements shift
  // around before render and can't be managed reliably in state, so dirty poll
  // the placeholder position to check if the floating element's position
  // matches, and call again if not.
  updateIframePosition = () => {
    if (Viewport.isMobile()) return

    if (!this.iframePlaceholder?.current) {
      console.warn('Could not find iframePlaceholder node')
      return
    }

    const node = this.iframePlaceholder.current
    const {
      iframePlaceholderTop,
      iframePlaceholderLeft,
      iframePlaceholderWidth,
      iframePlaceholderHeight,
    } = this.state

    const { top, left, width, height } = node.getBoundingClientRect()

    // Account for the layout element's offset which confuses calculations after
    // resize
    const layoutElem = document.querySelector('#layout')
    const matrix = window
      .getComputedStyle(layoutElem)
      .transform.replace(/(?:^matrix\(|\)$)/g, '')
      .split(',')
      .map(n => Number(n.trim()))

    const transformLeft = Math.abs(matrix[4])

    if (
      iframePlaceholderLeft !== left - transformLeft ||
      iframePlaceholderTop !== top ||
      iframePlaceholderWidth !== width ||
      iframePlaceholderHeight !== height
    ) {
      this.setState({
        iframePlaceholderTop: top,
        iframePlaceholderLeft: left + transformLeft,
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
      // iframePlaceholderLeft: left,
      iframePlaceholderWidth: width,
      iframePlaceholderHeight: height,
    } = this.state

    // Chrome 81
    let placeholderStyles = {}
    let paddingTop

    if (isChrome81) {
      const mobile = Viewport.isMobile()
      const position = mobile ? 'static' : 'absolute' // Only run re-positioning on desktop
      const x = aspectRatio.get('x')
      const y = aspectRatio.get('y')

      placeholderStyles = { top, width, height, position }

      // .iframe-placeholder styles
      paddingTop = mobile ? 0 : `${(y / x) * 100}%`
    }

    return (
      // <ReaderContext.Consumer>
      //   {() => (
      // <DeferredContext.Consumer>
      // {({ called }) => (
      <React.Fragment>
        {/*
            The iframePlaceholder element is a statically positioned div that
            fills the space that should be occupied by the ReactPlayer iframe.
            The iframe is absolutely positioned and is set to top and left
            positions of the placeholder. This is to address a bug in Chrome 81
            that prevents iframes from loading in multiple column layouts.
        */
        isChrome81 && (
          <div
            key={`placholder-${url}`}
            style={{ paddingTop }}
            className="iframe-placeholder"
            ref={this.iframePlaceholder}
          />
        )}

        {/*
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
          `}</style>
        )}

        {/* Ref is used to calculate spread position in HOC */}
        <div style={placeholderStyles} key={url} ref={this.props.elemRef}>
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
      //   )}
      // </DeferredContext.Consumer>
      //   )}
      // </ReaderContext.Consumer>
    )
  }
}

export default withNodePosition(Vimeo, { useParentDimensions: true })
