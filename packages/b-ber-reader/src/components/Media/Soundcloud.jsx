import React from 'react'
import ReactPlayer from 'react-player'
import withNodePosition from '../../lib/with-node-position'
import ReaderContext from '../../lib/reader-context'
import {
  getURLAndQueryParamters,
  getPlayerPropsFromQueryString,
  transformQueryParamsToProps,
  getPlayingStateOnUpdate,
} from '../../helpers/media'

class Soundcloud extends React.Component {
  static contextType = ReaderContext

  state = {
    url: '',
    // controls: true, // TODO custom controls tbd
    playing: false,
    autoplay: false,
    playerOptions: {},
    currentSpreadIndex: null,
  }

  UNSAFE_componentWillMount() {
    const { src } = this.props

    const queryString = getURLAndQueryParamters(src)[1]
    const playerOptions = transformQueryParamsToProps(
      getPlayerPropsFromQueryString(queryString)
    )

    // Extract autoplay property for use during page change events. Do this
    // after `transformQueryParamsToProps` to ensure boolean attrs
    const { url, autoplay, ...rest } = playerOptions

    // Controls is needed both in state and in playerOptions
    // const { controls } = playerOptions

    this.setState({ url, autoplay, playerOptions: { ...rest } })
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

  handlePause = () => this.setState({ playing: false })

  handleEnded = () => this.setState({ playing: false })

  render() {
    const { url, /*controls, */ playing, playerOptions } = this.state

    return (
      <React.Fragment>
        {/* Ref is used to calculate spread position in HOC */}
        <div key={url} ref={this.props.elemRef}>
          <ReactPlayer
            url={url}
            width="100%"
            height="100%"
            playing={playing}
            playsinline={true}
            config={{ soundcloud: playerOptions }}
            // controls={controls}
            onPause={this.handlePause}
            onEnded={this.handleEnded}
          />
        </div>
      </React.Fragment>
    )
  }
}

export default withNodePosition(Soundcloud)
