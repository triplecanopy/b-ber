import { useContext, useEffect, useRef, useState } from 'react'
import { MEDIA_PLAYBACK_RATES } from '../../constants'
import ReaderContext from '../../lib/reader-context'

// Seconds to skip when clicking fast-forward/rewind. Ensure that this is
// consistent with Material icon
const skipStep = 30

export interface MediaPlayerState {
  autoPlay: boolean
  paused: boolean
  loop: boolean
  volume: number
  playbackRate: number
  currentTime: number
  duration: number
  seeking: boolean
  muted: boolean
  progress: number
  timeElapsed: string
  timeRemaining: string
  currentSrc: string
  userInitiatedPause: boolean
}

interface MediaPlayerProps {
  elemRef: React.RefObject<HTMLMediaElement>
  spreadIndex?: number | null
  autoPlay?: boolean
  [key: string]: any
}

// @param   seconds float
// @return  string
const displayTime = (mediaTime: number): string => {
  const time = Math.round(mediaTime)

  const remainder = time % 60
  const wholeMinutes = (time - remainder) / 60
  const seconds = String(remainder).padStart(2, '0')
  const minutes = String(wholeMinutes).padStart(2, '0')

  return `${minutes}:${seconds}`
}

// Shim
const fullscreenElement = () => {
  // Vendor-prefixed fullscreen APIs are not in the DOM lib typings.
  const doc = document as any
  return (
    doc.fullscreenElement ||
    doc.webkitFullscreenElement ||
    doc.mozFullScreenElement ||
    doc.msFullscreenElement
  )
}

const requestFullscreen = (elem: any) => {
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

const exitFullscreen = (elem: any) => {
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

// All of Media's playback/controls logic lives here so the (now functional)
// Media component is a thin view. State that the class read live via `this.state`
// is mirrored in a ref so the imperative methods always see the current values
// (setState alone is async); DOM writes use the computed value directly rather
// than a setState callback. See TASK-096 / MIGRATION-CONVENTIONS.md §3a–§3d.
export const useMediaPlayer = (props: MediaPlayerProps) => {
  const { elemRef } = props
  const context = useContext(ReaderContext)

  const [state, setStateInternal] = useState<MediaPlayerState>(() => ({
    // UNSAFE_componentWillMount promoted data-autoplay to the autoPlay flag
    // before first render; fold that into the initializer (§3a).
    autoPlay: props['data-autoplay'] === true || props.autoPlay || false,
    paused: true,
    loop: false,
    volume: 1,
    playbackRate: MEDIA_PLAYBACK_RATES.NORMAL,
    currentTime: 0,
    duration: 0,
    seeking: false,
    muted: false,
    progress: 0,
    timeElapsed: '00:00',
    timeRemaining: '00:00',
    currentSrc: '',
    userInitiatedPause: false,
  }))

  // The class read this.state live inside its methods; keep a ref in sync so
  // the converted methods do the same instead of closing over a stale value.
  const stateRef = useRef(state)
  stateRef.current = state

  const setState = (partial: Partial<MediaPlayerState>) =>
    setStateInternal((prev) => ({ ...prev, ...partial }))

  const playMedia = () => {
    // The `play` method returns a promise and errors out if the
    // user hasn't interacted with the page yet on Chrome and
    // Safari. This prevents the error, although it doesn't play the
    // media
    const p = elemRef.current.play()
    if (p) p.catch(() => {})

    updateControlsUI()
  }

  const pauseMedia = () => {
    elemRef.current.pause()
  }

  const play = () => {
    setState({ paused: false, userInitiatedPause: false })
    playMedia()
  }

  const pause = () => {
    setState({ paused: true, userInitiatedPause: true })
    pauseMedia()
  }

  const updateTime = (step: number) => {
    const { duration } = stateRef.current
    let currentTime = stateRef.current.currentTime

    currentTime = parseFloat((currentTime + step).toFixed(10))
    currentTime = Math.max(0, Math.min(currentTime, duration))

    setState({ currentTime })
    elemRef.current.currentTime = currentTime
    updateControlsUI()
  }

  const updateVolume = (e: React.ChangeEvent<HTMLInputElement>) => {
    // The range input yields a string; it flows through state unchanged and is
    // coerced by the media element's `volume` setter.
    const volume = e.currentTarget.value as unknown as number

    setState({ volume })
    elemRef.current.volume = volume
  }

  const updateLoop = () => {
    const loop = !stateRef.current.loop
    setState({ loop })
    elemRef.current.loop = loop
  }

  const updatePlaybackRate = (playbackRate: number) => {
    setState({ playbackRate })
    elemRef.current.playbackRate = playbackRate
  }

  const updateTimeStamps = () => {
    // Check that the element exists since this is called in a timeout
    if (!elemRef?.current) return

    const { currentTime } = elemRef.current
    const timeElapsed = displayTime(currentTime)

    setState({ currentTime, timeElapsed })
  }

  const updateProgress = () => {
    // Check that the element exists since this is called in a timeout
    if (!elemRef?.current) return

    const progress = elemRef.current.currentTime
    setState({ progress })
  }

  function updateControlsUI() {
    updateTimeStamps()
    updateProgress()

    // Call recursively if playing and if the element still exists
    if (stateRef.current.paused) return
    if (!elemRef?.current) return

    setTimeout(updateControlsUI, 1000)
  }

  const timeForward = () => updateTime(skipStep)

  const timeBack = () => updateTime(skipStep * -1)

  const seek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const progress = Number(e.target.value)
    const currentTime = progress

    setState({ progress, currentTime })
    elemRef.current.currentTime = currentTime
    updateTimeStamps()
  }

  const toggleFullscreen = () => {
    const elem = elemRef.current

    if (fullscreenElement()) {
      exitFullscreen(elem)
    } else {
      requestFullscreen(elem)
    }
  }

  const handleLoad = () => {
    const {
      seeking,
      currentTime,
      duration,
      playbackRate,
      loop,
      volume,
      muted,
      currentSrc,
    } = elemRef.current

    elemRef.current.preload = 'auto'

    const timeRemaining = displayTime(duration)

    setState({
      seeking,
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

  const handleEnded = () => setState({ paused: true, userInitiatedPause: true })

  const onCanPlay = (nextProps: MediaPlayerProps, nextContext: any) => {
    const { paused, userInitiatedPause } = stateRef.current

    // Play the media if it's located on the current spread
    if (
      paused === true &&
      userInitiatedPause === false &&
      nextProps.spreadIndex === nextContext.spreadIndex
    ) {
      setState({ paused: false })
      playMedia()
    }

    // Otherwise pause the media
    if (nextProps.spreadIndex !== nextContext.spreadIndex && paused === false) {
      setState({ paused: true })
      pauseMedia()
    }
  }

  // UNSAFE_componentWillReceiveProps registered a one-shot canplay listener on
  // every spread change (never on mount) when autoplay was on. Reproduce that
  // as an effect keyed on the visible spread, skipping the mount run, and clean
  // the listener up so repeated navigation can't leak handlers (§3d).
  const isFirstRender = useRef(true)
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }

    if (!stateRef.current.autoPlay) return

    const elem = elemRef.current
    if (!elem) return

    // Play the media on spread update if autoplay is true
    const listener = () => {
      onCanPlay(props, context)
      elem.removeEventListener('canplay', listener)
    }

    elem.addEventListener('canplay', listener)
    return () => elem.removeEventListener('canplay', listener)
    // biome-ignore lint/correctness/useExhaustiveDependencies: mirror
    // componentWillReceiveProps — react to spread navigation only.
  }, [context?.spreadIndex])

  return {
    state,
    setState,
    play,
    pause,
    playMedia,
    pauseMedia,
    updateTime,
    updateVolume,
    updateLoop,
    updatePlaybackRate,
    displayTime,
    updateControlsUI,
    updateTimeStamps,
    updateProgress,
    timeForward,
    timeBack,
    seek,
    fullscreenElement,
    requestFullscreen,
    exitFullscreen,
    toggleFullscreen,
    handleLoad,
    handleEnded,
    onCanPlay,
  }
}
