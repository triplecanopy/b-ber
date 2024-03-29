/* eslint-disable no-unused-vars,react/no-unused-state */

import React from 'react'
import ReaderContext from '../../lib/reader-context'
import withNodePosition from '../../lib/with-node-position'
import MediaControls from './Controls/MediaControls'
import { MEDIA_CONTROLS_PRESETS, MEDIA_PLAYBACK_RATES } from '../../constants'

class Media extends React.Component {
  static contextType = ReaderContext

  // Seconds to skip when clicking fast-forward/rewind. Ensure that this is
  // consistent with Material icon
  static skipStep = 30

  state = {
    autoPlay: this.props.autoPlay || false,
    paused: true,
    loop: false,
    volume: 1,
    playbackRate: MEDIA_PLAYBACK_RATES.NORMAL,
    currentTime: 0,
    duration: 0,
    seeking: false,
    muted: false,
    // readyState: 0,
    progress: 0,
    timeElapsed: '00:00',
    timeRemaining: '00:00',
    currentSrc: '',
    userInitiatedPause: false,
  }

  UNSAFE_componentWillMount() {
    if (this.props['data-autoplay'] === true) {
      this.setState({ autoPlay: true })
    }
  }

  UNSAFE_componentWillReceiveProps(nextProps, nextContext) {
    // Play the media on spread update if autoplay is true
    if (!this.state.autoPlay) return

    // Don't play the media unless the chapter is visible
    // if (!nextProps.view.loaded || nextProps.view.pendingDeferredCallbacks) {
    //   return
    // }

    const _this = this
    this.props.elemRef.current.addEventListener('canplay', function listener() {
      _this.onCanPlay(nextProps, nextContext)
      _this.props.elemRef.current.removeEventListener('canplay', listener)
    })

    // Don't play the media unless it's sufficiently loaded
    // if (this.props.elemRef.current.readyState < 2) {
    //   console.log('Media not loaded')

    // console.log('add', this.props.elemRef.current)

    // this.props.elemRef.current.preload = 'metadata'
    // this.props.elemRef.current.addEventListener('canplay', () =>
    //   this.onCanPlay(nextProps, nextContext)
    // )

    //   return
    // }

    // this.onCanPlay(nextProps, nextContext)
  }

  onCanPlay = (nextProps, nextContext) => {
    const { paused, userInitiatedPause } = this.state

    // b-ber jumps from spreadIndex n to 0 quickly and causes a blip before
    // the chapter updates, so account for that here
    // if (nextContext.lastSpread && nextContext.spreadIndex === 0) return

    // Play the media if it's located on the current spread

    if (
      paused === true &&
      userInitiatedPause === false &&
      nextProps.spreadIndex === nextContext.spreadIndex
    ) {
      this.setState({ paused: false }, () => this.playMedia())
    }

    // Otherwise pause the media
    if (nextProps.spreadIndex !== nextContext.spreadIndex && paused === false) {
      this.setState({ paused: true }, () => this.pauseMedia())
    }
  }

  playMedia = () => {
    // The `play` method returns a promise and errors out if the
    // user hasn't interacted with the page yet on Chrome and
    // Safari. This prevents the error, although it doesn't play the
    // media

    const p = this.props.elemRef.current.play()
    if (p) p.catch(() => {})

    this.updateControlsUI()
  }

  pauseMedia = () => {
    this.props.elemRef.current.pause()
  }

  play = () =>
    this.setState({ paused: false, userInitiatedPause: false }, () =>
      this.playMedia()
    )

  pause = () =>
    this.setState({ paused: true, userInitiatedPause: true }, () =>
      this.pauseMedia()
    )

  updateTime = step => {
    const { duration } = this.state
    let { currentTime } = this.state

    currentTime = parseFloat((currentTime + step).toFixed(10))
    currentTime = Math.max(0, Math.min(currentTime, duration))

    this.setState({ currentTime }, () => {
      this.props.elemRef.current.currentTime = this.state.currentTime
      this.updateControlsUI()
    })
  }

  updateVolume = e => {
    const volume = e.currentTarget.value

    this.setState(
      { volume },
      () => (this.props.elemRef.current.volume = this.state.volume)
    )
  }

  updateLoop = () => {
    const loop = !this.state.loop
    this.setState(
      { loop },
      () => (this.props.elemRef.current.loop = this.state.loop)
    )
  }

  updatePlaybackRate = playbackRate =>
    this.setState(
      { playbackRate },
      () => (this.props.elemRef.current.playbackRate = this.state.playbackRate)
    )

  // @param   seconds float
  // @return  string
  // eslint-disable-next-line class-methods-use-this
  displayTime(mediaTime) {
    const time = Math.round(mediaTime)

    let seconds = time % 60
    let minutes = (time - seconds) / 60
    seconds = String(seconds).padStart(2, '0')
    minutes = String(minutes).padStart(2, '0')

    return `${minutes}:${seconds}`
  }

  updateControlsUI = () => {
    this.updateTimeStamps()
    this.updateProgress()

    // Call recursively if playing and if the element still exists
    if (this.state.paused) return
    if (!this.props.elemRef?.current) return

    setTimeout(this.updateControlsUI.bind(this), 1000)
  }

  updateTimeStamps = () => {
    // Check that the element exists since this is called in a timeout
    if (!this.props.elemRef?.current) return

    const { currentTime } = this.props.elemRef.current
    const timeElapsed = this.displayTime(currentTime)

    this.setState({ currentTime, timeElapsed })
  }

  updateProgress = () => {
    // Check that the element exists since this is called in a timeout
    if (!this.props.elemRef?.current) return

    const progress = this.props.elemRef.current.currentTime
    this.setState({ progress })
  }

  timeForward = () => this.updateTime(Media.skipStep)

  timeBack = () => this.updateTime(Media.skipStep * -1)

  seek = e => {
    const progress = Number(e.target.value)
    const currentTime = progress

    this.setState({ progress, currentTime }, () => {
      this.props.elemRef.current.currentTime = this.state.currentTime
      this.updateTimeStamps()
    })
  }

  // Shim
  // eslint-disable-next-line class-methods-use-this
  fullscreenElement() {
    return (
      document.fullscreenElement ||
      document.webkitFullscreenElement ||
      document.mozFullScreenElement ||
      document.msFullscreenElement
    )
  }

  // eslint-disable-next-line class-methods-use-this
  requestFullscreen(elem) {
    if (elem.requestFullscreen) {
      elem.requestFullscreen()
    } else if (elem.mozRequestFullScreen) {
      elem.mozRequestFullScreen()
    } else if (elem.webkitRequestFullscreen) {
      elem.webkitRequestFullscreen()
    } else if (elem.msRequestFullscreen) {
      elem.msRequestFullscreen()
    }
  }

  // eslint-disable-next-line class-methods-use-this
  exitFullscreen(elem) {
    if (elem.exitFullscreen) {
      elem.exitFullscreen()
    } else if (elem.mozCancelFullScreen) {
      elem.mozCancelFullScreen()
    } else if (elem.webkitExitFullscreen) {
      elem.webkitExitFullscreen()
    } else if (elem.msExitFullscreen) {
      elem.msExitFullscreen()
    }
  }

  toggleFullscreen = () => {
    const elem = this.props.elemRef.current

    if (this.fullscreenElement()) {
      this.exitFullscreen(elem)
    } else {
      this.requestFullscreen(elem)
    }
  }

  handleLoad = () => {
    const {
      seeking,
      currentTime,
      duration,
      playbackRate,
      loop,
      volume,
      muted,
      currentSrc,
    } = this.props.elemRef.current

    this.props.elemRef.current.preload = 'auto'

    const timeRemaining = this.displayTime(duration)

    this.setState({
      // eslint-disable-next-line react/no-unused-state
      seeking,
      // eslint-disable-next-line react/no-unused-state
      muted,
      currentTime,
      duration,
      playbackRate,
      loop,
      volume,
      timeRemaining,
      currentSrc,
    })
  }

  handleEnded = () => this.setState({ paused: true, userInitiatedPause: true })

  render() {
    const {
      elemRef,
      verso,
      recto,
      spreadIndex,
      elementEdgeLeft,
      MediaComponent,
      mediaType,
      autoPlay,
      currentSpreadIndex,
      view,
      viewerSettings,
      readerSettings,
      controls: controlsAttribute,

      // `rest` includes React.Children, and the HTML5 media attributes except
      // `controls` and `autoPlay` since those are handled internally.
      ...rest
    } = this.props

    // MediaControls overrides the browser's default controls for media
    // elements. The UI is configured by passing in one of the options below.
    // The UI config option (simple, normal or full) must be passed in via the
    // `controls` attribute on the media element.
    //
    // If the `controls` attribute is not present on the media element, the
    // controls are completely hidden. If the controls element is anything other
    // than one of the options below, the default browser controls UI is shown.
    //
    // Audio
    //  'simple'
    //     - play/pause button
    //     - progress bar
    //  'normal'
    //     - play/pause button
    //     - progress bar
    //     - time elapsed/remaining
    //     - skip ahead/skip back buttons
    //     - volume controls
    //     - download button
    //  'full'
    //     - play/pause button
    //     - progress bar
    //     - time elapsed/remaining
    //     - skip ahead/skip back buttons
    //     - volume controls
    //     - download button
    //     - loop button
    //     - playback speed
    //
    // Video
    //  'simple'
    //     - play/pause button
    //     - progress bar
    //  'normal'
    //     - play/pause button
    //     - progress bar
    //     - time elapsed/remaining
    //     - volume controls
    //     - fullscreen button
    //  'full'
    //     - play/pause button
    //     - progress bar
    //     - time elapsed/remaining
    //     - volume controls
    //     - fullscreen button
    //     - playback speed

    let config = null
    let controls = true

    if (!controlsAttribute) {
      controls = false
    } else if (MEDIA_CONTROLS_PRESETS.has(controlsAttribute)) {
      config = controlsAttribute
      controls = false
    }

    return (
      <>
        <MediaComponent
          elementKey={rest.id}
          elementRef={elemRef}
          handleLoad={this.handleLoad}
          handleEnded={this.handleEnded}
          controls={controls}
          {...rest}
        />
        <MediaControls
          config={config}
          mediaType={mediaType}
          play={this.play}
          pause={this.pause}
          timeForward={this.timeForward}
          timeBack={this.timeBack}
          updateVolume={this.updateVolume}
          updateLoop={this.updateLoop}
          updatePlaybackRate={this.updatePlaybackRate}
          seek={this.seek}
          toggleFullscreen={this.toggleFullscreen}
          currentSrc={this.state.currentSrc}
          currentTime={this.state.currentTime}
          duration={this.state.duration}
          progress={this.state.progress}
          timeElapsed={this.state.timeElapsed}
          timeRemaining={this.state.timeRemaining}
          paused={this.state.paused}
          playbackRate={this.state.playbackRate}
          volume={this.state.volume}
          loop={this.state.loop}
        />
      </>
    )
  }
}

export default withNodePosition(Media, {
  useParentDimensions: true,
  // useFullscreenElementWidth: true,
})
