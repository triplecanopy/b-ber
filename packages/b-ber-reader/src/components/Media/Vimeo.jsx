import React from 'react'
import PropTypes from 'prop-types'
import omit from 'lodash/omit'
import classNames from 'classnames'
import ReactPlayer from 'react-player'
import has from 'lodash/has'
import withNodePosition from '../withNodePosition'
import Url from '../../helpers/Url'

const VimeoPosterImage = ({ src, playing, controls, handleUpdatePlaying }) => {
  if (!src) return null

  // TODO how to handle play/pause/end? poster image reappears?
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
  static contextTypes = {
    spreadIndex: PropTypes.number,
    viewLoaded: PropTypes.bool,
    lastSpread: PropTypes.bool,
  }

  // Props that are on the vimeo player which must be managed by state
  static blacklistedProps = ['autopause' /* , 'controls' */]

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
  }

  componentWillMount() {
    const { src, posterImage } = this.props
    const [url, queryString] = this.getVimeoURLAndQueryParamters(src)

    let playerOptions = this.getReactPlayerPropsFromQueryStringParameters(
      queryString
    )

    playerOptions = this.transformVimeoProps(playerOptions)

    console.log(playerOptions)

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
      playerOptions: { ...rest },
    })
  }

  componentWillReceiveProps(_, nextContext) {
    // Only elements with an autoplay attribute
    if (!this.state.autoplay) return

    // Only if the view is fully rendered
    if (!nextContext.viewLoaded) return

    let { currentSpreadIndex } = this.state
    const { spreadIndex: elementSpreadIndex } = this.props
    const { spreadIndex: nextSpreadIndex } = nextContext

    // Only if user is navigating to a new spread
    if (currentSpreadIndex === nextSpreadIndex) return

    // Update the `currentSpreadIndex` so that the user can continue to interact
    // with the video (play/pause) as normal
    currentSpreadIndex = nextSpreadIndex

    // Play or pause the video. If `elementSpreadIndex`
    const playing = elementSpreadIndex === nextSpreadIndex

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

  render() {
    const {
      url,
      loop,
      muted,
      controls,
      playing,
      posterImage,
      playerOptions,
    } = this.state

    return (
      <div
        ref={this.props.elemRef /* Used to calculate spread position in HOC */}
      >
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
    )
  }
}

export default withNodePosition(Vimeo, { useParentDimensions: true })
