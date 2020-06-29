import React from 'react'
import ReactPlayer from 'react-player'
import withNodePosition from '../../lib/with-node-position'
import ReaderContext from '../../lib/reader-context'
import Url from '../../helpers/Url'
import Viewport from '../../helpers/Viewport'

class Soundcloud extends React.Component {
  static contextType = ReaderContext

  state = {
    url: '',
    // controls: true, // TODO custom controls tbd
    playing: false,
    autoplay: true,
    playerOptions: {},
    currentSpreadIndex: null,
  }

  UNSAFE_componentWillMount() {
    const { src } = this.props
    const queryString = this.getVimeoURLAndQueryParamters(src)[1]

    let playerOptions = this.getReactPlayerPropsFromQueryStringParameters(
      queryString
    )

    playerOptions = this.transformVimeoProps(playerOptions)

    // Extract autoplay property for use during page change events. Do this
    // after `transformVimeoProps` to ensure boolean attrs
    const { url, autoplay, ...rest } = playerOptions

    // Controls is needed both in state and in playerOptions
    // const { controls } = playerOptions

    this.setState({ url, autoplay, playerOptions: { ...rest } })
  }

  UNSAFE_componentWillReceiveProps(nextProps, nextContext) {
    // Only elements with an autoplay attribute
    if (!this.state.autoplay) return

    // Only if the view is fully rendered
    if (!this.props.view.loaded) return
    if (this.props.view.pendingDeferredCallbacks) return

    let { currentSpreadIndex } = this.state

    // The index that the element is rendered on as calculated by
    // withNodePosition
    const { spreadIndex: elementSpreadIndex } = nextProps

    // The spread index that's currently in view
    const { spreadIndex: visibleSpreadIndex } = nextContext

    // Only if user is navigating to a new spread
    if (currentSpreadIndex === visibleSpreadIndex) return

    // Update the `currentSpreadIndex` so that the user can continue to interact
    // with the video (play/pause) as normal
    currentSpreadIndex = visibleSpreadIndex

    // Play or pause the video
    const playing =
      elementSpreadIndex === visibleSpreadIndex && !Viewport.isMobile()

    this.setState({ playing, currentSpreadIndex })
  }

  transformVimeoProps = props => {
    // Remove blacklisted props
    // const options = omit(props, Vimeo.blacklistedProps)
    // const options = props

    // Cast boolean attributes
    const truthy = new Set(['true', '1'])
    const falsey = new Set(['false', '0'])
    const bools = new Set([...truthy, ...falsey])

    const nextProps = Object.entries(props).reduce((acc, [key, value]) => {
      acc[key] = bools.has(value) ? truthy.has(value) : value
      return acc
    }, {})

    // Autoplay on mobile
    nextProps.playsinline = true

    return nextProps
  }

  handlePause = () => this.setState(state => ({ ...state, playing: false }))

  handleEnded = () => this.setState(state => ({ ...state, playing: false }))

  getReactPlayerPropsFromQueryStringParameters = queryString =>
    Url.parseQueryString(queryString)

  getVimeoURLAndQueryParamters = url => url.split('?')

  render() {
    const { url, /*controls, */ playing, playerOptions } = this.state

    return (
      <React.Fragment>
        {/* Ref is used to calculate spread position in HOC */}
        <div key={url} ref={this.props.elemRef}>
          <ReactPlayer
            url={url}
            // width="100%"
            // height="100%"
            // controls={controls}
            playing={playing}
            playsinline={true}
            config={{ soundcloud: playerOptions }}
            // onPause={this.handlePause}
            // onEnded={this.handleEnded}
          />
        </div>
      </React.Fragment>
    )
  }
}

export default withNodePosition(Soundcloud, { useParentDimensions: true })
