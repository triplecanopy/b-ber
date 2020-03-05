import React from 'react'
import PropTypes from 'prop-types'
import omit from 'lodash/omit'
import classNames from 'classnames'
import ReactPlayer from 'react-player'
import withNodePosition from '../withNodePosition'
import Url from '../../helpers/Url'

const VimeoPosterImage = ({ src, playing, handleUpdatePlaying }) => {
  if (!src) return null

  // TODO how to handle play/pause/end? poster image reappears?
  return (
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events,jsx-a11y/no-noninteractive-element-interactions
    <img
      className={classNames('poster poster--vimeo', { visible: !playing })}
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
  static blacklistedProps = ['controls', 'autoplay', 'autopause', 'playsinline']

  state = {
    url: '',
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

    // Extract autoplay property for use during page change events
    const { autoplay } = playerOptions

    playerOptions = this.transformVimeoProps(playerOptions)

    this.setState({ url, posterImage, autoplay, playerOptions })
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

  transformVimeoProps = props => omit(props, Vimeo.blacklistedProps)

  getReactPlayerPropsFromQueryStringParameters = queryString =>
    Url.parseQueryString(queryString)

  getVimeoURLAndQueryParamters = url => url.split('?')

  render() {
    const { url, controls, playing, posterImage, playerOptions } = this.state

    return (
      <div
        ref={this.props.elemRef /* Used to calculate spread position in HOC */}
      >
        <VimeoPosterImage
          src={posterImage}
          playing={playing}
          handleUpdatePlaying={this.handleUpdatePlaying}
        />
        <ReactPlayer
          url={url}
          width="100%"
          height="100%"
          playing={playing}
          playsinline={true}
          controls={controls}
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
