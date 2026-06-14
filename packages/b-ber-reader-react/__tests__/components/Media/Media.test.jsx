/* eslint-disable react/jsx-props-no-spreading */

import { act, render } from '@testing-library/react'
import React from 'react'
import Media from '../../../src/components/Media/Media'
import { useMediaPlayer } from '../../../src/components/Media/useMediaPlayer'
import ReaderContext from '../../../src/lib/reader-context'

// Media now reads its element ref + spread position from useNodePosition rather
// than HOC-injected props; stub it. The useMediaPlayer-focused tests below call
// the hook directly (the Probe component) and supply elemRef/spreadIndex as its
// arguments, so they're unaffected by this mock.
jest.mock('../../../src/hooks/use-node-position', () => ({
  __esModule: true,
  default: () => ({
    elemRef: { current: null },
    verso: false,
    recto: false,
    spreadIndex: 0,
    elementEdgeLeft: 0,
    view: {},
    viewerSettings: {},
    readerSettings: {},
  }),
}))

const MediaComponentStub = React.forwardRef((props, ref) => (
  // eslint-disable-next-line jsx-a11y/media-has-caption
  <audio ref={ref} data-testid="media-el" {...props} />
))

const baseProps = (overrides = {}) => ({
  id: 'media-1',
  mediaType: 'audio',
  MediaComponent: MediaComponentStub,
  ...overrides,
})

const renderMedia = (props, contextValue) => {
  const tree = render(
    <ReaderContext.Provider value={contextValue}>
      <Media {...props} />
    </ReaderContext.Provider>
  )
  return tree
}

const makeElemRef = (tagName = 'audio') => {
  const elem = document.createElement(tagName)
  elem.play = jest.fn().mockResolvedValue(undefined)
  elem.pause = jest.fn()
  return { current: elem }
}

const defaultContext = {
  lastSpread: false,
  spreadIndex: 0,
  getTranslateX: () => 0,
  navigateToChapterByURL: () => {},
  getSpineItemByAbsoluteUrl: () => {},
}

// Media's playback/controls logic now lives in the useMediaPlayer hook. These
// helpers render the hook inside a ReaderContext so tests can exercise it the
// way the old class tests exercised the component instance: `player.current` is
// the hook's return value (state + methods), and `rerender` lets a test change
// props/context to drive the spread-change effect.
const renderPlayer = (mediaProps, contextValue = defaultContext) => {
  const player = { current: null }

  function Probe({ p }) {
    player.current = useMediaPlayer(p)
    return null
  }

  const ui = (p, ctx) => (
    <ReaderContext.Provider value={ctx}>
      <Probe p={p} />
    </ReaderContext.Provider>
  )

  const tree = render(ui(mediaProps, contextValue))

  return {
    ...tree,
    player,
    rerender: (p = mediaProps, ctx = contextValue) => tree.rerender(ui(p, ctx)),
  }
}

describe('Media', () => {
  beforeEach(() => {
    console.warn = jest.fn()
    console.error = jest.fn()
  })

  afterEach(() => {
    jest.clearAllMocks()
    jest.useRealTimers()
  })

  describe('rendering', () => {
    test('renders without controls when controls attribute is falsy', () => {
      const props = baseProps({ controls: undefined })

      const tree = renderMedia(props, defaultContext)

      expect(tree.getByTestId('media-el')).toBeTruthy()
    })

    test('renders with config when controls matches a preset', () => {
      const props = baseProps({ controls: 'simple' })

      const tree = renderMedia(props, defaultContext)

      expect(
        tree.container.querySelector('.bber-media__controls--simple')
      ).toBeTruthy()
    })

    test('renders default browser controls when controls is not a preset', () => {
      const props = baseProps({ controls: true })

      const tree = renderMedia(props, defaultContext)

      expect(tree.getByTestId('media-el')).toBeTruthy()
      // No MediaControls config rendered since `controls` isn't a preset string
      expect(tree.container.querySelector('.bber-media__controls')).toBeFalsy()
    })
  })

  test('promotes data-autoplay to the autoPlay flag before first render', () => {
    const elemRef = makeElemRef()
    const props = baseProps({
      elemRef,
      controls: 'simple',
      'data-autoplay': true,
    })

    const { player } = renderPlayer(props)

    expect(player.current.state.autoPlay).toBe(true)
  })

  test('play() sets paused/userInitiatedPause and calls elemRef.play', async () => {
    const elemRef = makeElemRef()
    const props = baseProps({ elemRef, controls: 'simple' })

    const { player } = renderPlayer(props)

    await act(async () => {
      player.current.play()
    })

    expect(player.current.state.paused).toBe(false)
    expect(player.current.state.userInitiatedPause).toBe(false)
    expect(elemRef.current.play).toHaveBeenCalled()
  })

  test('pause() sets paused/userInitiatedPause and calls elemRef.pause', async () => {
    const elemRef = makeElemRef()
    const props = baseProps({ elemRef, controls: 'simple' })

    const { player } = renderPlayer(props)

    await act(async () => {
      player.current.pause()
    })

    expect(player.current.state.paused).toBe(true)
    expect(player.current.state.userInitiatedPause).toBe(true)
    expect(elemRef.current.pause).toHaveBeenCalled()
  })

  test('playMedia handles a play() promise rejection silently', async () => {
    const elemRef = makeElemRef()
    elemRef.current.play = jest.fn().mockRejectedValue(new Error('nope'))

    const props = baseProps({ elemRef, controls: 'simple' })

    const { player } = renderPlayer(props)

    await act(async () => {
      player.current.playMedia()
      // Allow the rejected promise's .catch to flush
      await Promise.resolve()
      await Promise.resolve()
    })

    expect(elemRef.current.play).toHaveBeenCalled()
  })

  test('playMedia handles play() returning undefined', () => {
    const elemRef = makeElemRef()
    elemRef.current.play = jest.fn().mockReturnValue(undefined)

    const props = baseProps({ elemRef, controls: 'simple' })

    const { player } = renderPlayer(props)

    player.current.state.paused = true
    expect(() => player.current.playMedia()).not.toThrow()
    expect(elemRef.current.play).toHaveBeenCalled()
  })

  describe('updateTime / timeForward / timeBack / seek', () => {
    let elemRef
    let player

    beforeEach(() => {
      elemRef = makeElemRef()
      const props = baseProps({ elemRef, controls: 'simple' })

      player = renderPlayer(props).player

      // Ensure paused so updateControlsUI doesn't recursively schedule
      act(() => {
        player.current.setState({
          duration: 100,
          currentTime: 50,
          paused: true,
        })
      })
    })

    test('timeForward advances currentTime by skipStep, clamped to duration', () => {
      act(() => {
        player.current.timeForward()
      })

      expect(player.current.state.currentTime).toBe(80)
      expect(elemRef.current.currentTime).toBe(80)
    })

    test('timeBack decreases currentTime by skipStep, clamped to 0', () => {
      act(() => {
        player.current.setState({ currentTime: 10 })
      })
      act(() => {
        player.current.timeBack()
      })

      expect(player.current.state.currentTime).toBe(0)
      expect(elemRef.current.currentTime).toBe(0)
    })

    test('updateTime clamps currentTime to duration upper bound', () => {
      act(() => {
        player.current.setState({ currentTime: 95, duration: 100 })
      })
      act(() => {
        player.current.updateTime(30)
      })

      expect(player.current.state.currentTime).toBe(100)
    })

    test('seek sets progress and currentTime from event target value', () => {
      act(() => {
        player.current.seek({ target: { value: '42' } })
      })

      expect(player.current.state.progress).toBe(42)
      expect(player.current.state.currentTime).toBe(42)
      expect(elemRef.current.currentTime).toBe(42)
    })
  })

  describe('updateVolume / updateLoop / updatePlaybackRate', () => {
    let elemRef
    let player

    beforeEach(() => {
      elemRef = makeElemRef()
      const props = baseProps({ elemRef, controls: 'simple' })

      player = renderPlayer(props).player
    })

    test('updateVolume updates state and elemRef.volume', () => {
      act(() => {
        player.current.updateVolume({ currentTarget: { value: '0.5' } })
      })

      expect(player.current.state.volume).toBe('0.5')
      expect(elemRef.current.volume).toBe(0.5)
    })

    test('updateLoop toggles loop state and elemRef.loop', () => {
      expect(player.current.state.loop).toBe(false)

      act(() => {
        player.current.updateLoop()
      })

      expect(player.current.state.loop).toBe(true)
      expect(elemRef.current.loop).toBe(true)

      act(() => {
        player.current.updateLoop()
      })

      expect(player.current.state.loop).toBe(false)
      expect(elemRef.current.loop).toBe(false)
    })

    test('updatePlaybackRate updates state and elemRef.playbackRate', () => {
      act(() => {
        player.current.updatePlaybackRate(1.5)
      })

      expect(player.current.state.playbackRate).toBe(1.5)
      expect(elemRef.current.playbackRate).toBe(1.5)
    })
  })

  describe('displayTime', () => {
    let player

    beforeEach(() => {
      const elemRef = makeElemRef()
      const props = baseProps({ elemRef, controls: 'simple' })

      player = renderPlayer(props).player
    })

    test('formats seconds as MM:SS with zero-padding', () => {
      expect(player.current.displayTime(5)).toBe('00:05')
      expect(player.current.displayTime(65)).toBe('01:05')
      expect(player.current.displayTime(3600)).toBe('60:00')
      expect(player.current.displayTime(0)).toBe('00:00')
    })
  })

  describe('updateControlsUI / updateTimeStamps / updateProgress', () => {
    test('updateTimeStamps and updateProgress read from elemRef and update state', () => {
      const elemRef = makeElemRef()
      elemRef.current.currentTime = 12

      const props = baseProps({ elemRef, controls: 'simple' })

      const { player } = renderPlayer(props)

      act(() => {
        player.current.updateTimeStamps()
      })
      expect(player.current.state.currentTime).toBe(12)
      expect(player.current.state.timeElapsed).toBe('00:12')

      act(() => {
        player.current.updateProgress()
      })
      expect(player.current.state.progress).toBe(12)
    })

    test('updateTimeStamps and updateProgress no-op when elemRef.current is missing', () => {
      const elemRef = makeElemRef()
      const props = baseProps({ elemRef, controls: 'simple' })

      const { player } = renderPlayer(props)

      elemRef.current = null

      expect(() => player.current.updateTimeStamps()).not.toThrow()
      expect(() => player.current.updateProgress()).not.toThrow()
    })

    test('updateControlsUI schedules a recursive setTimeout while playing', () => {
      jest.useFakeTimers()

      const elemRef = makeElemRef()
      elemRef.current.currentTime = 5

      const props = baseProps({ elemRef, controls: 'simple' })

      const { player } = renderPlayer(props)

      act(() => {
        player.current.setState({ paused: false })
      })

      const setTimeoutSpy = jest.spyOn(global, 'setTimeout')

      act(() => {
        player.current.updateControlsUI()
      })

      expect(setTimeoutSpy).toHaveBeenCalledWith(expect.any(Function), 1000)

      setTimeoutSpy.mockRestore()
    })

    test('updateControlsUI does not schedule when paused', () => {
      jest.useFakeTimers()

      const elemRef = makeElemRef()
      const props = baseProps({ elemRef, controls: 'simple' })

      const { player } = renderPlayer(props)

      act(() => {
        player.current.setState({ paused: true })
      })

      const setTimeoutSpy = jest.spyOn(global, 'setTimeout')

      act(() => {
        player.current.updateControlsUI()
      })

      expect(setTimeoutSpy).not.toHaveBeenCalled()

      setTimeoutSpy.mockRestore()
    })

    test('updateControlsUI does not schedule when elemRef.current is missing', () => {
      jest.useFakeTimers()

      const elemRef = makeElemRef()
      const props = baseProps({ elemRef, controls: 'simple' })

      const { player } = renderPlayer(props)

      act(() => {
        player.current.setState({ paused: false })
      })

      elemRef.current = null

      const setTimeoutSpy = jest.spyOn(global, 'setTimeout')

      act(() => {
        player.current.updateControlsUI()
      })

      expect(setTimeoutSpy).not.toHaveBeenCalled()

      setTimeoutSpy.mockRestore()
    })
  })

  describe('fullscreen handling', () => {
    let elemRef
    let player

    beforeEach(() => {
      elemRef = makeElemRef('video')
      const props = baseProps({
        elemRef,
        mediaType: 'video',
        controls: 'simple',
      })

      player = renderPlayer(props).player
    })

    afterEach(() => {
      // Reset fullscreenElement between tests
      Object.defineProperty(document, 'fullscreenElement', {
        value: null,
        configurable: true,
      })
    })

    test('toggleFullscreen requests fullscreen when not currently fullscreen', () => {
      Object.defineProperty(document, 'fullscreenElement', {
        value: null,
        configurable: true,
      })
      elemRef.current.requestFullscreen = jest.fn()
      elemRef.current.exitFullscreen = jest.fn()

      player.current.toggleFullscreen()

      expect(elemRef.current.requestFullscreen).toHaveBeenCalled()
      expect(elemRef.current.exitFullscreen).not.toHaveBeenCalled()
    })

    test('toggleFullscreen exits fullscreen when currently fullscreen', () => {
      Object.defineProperty(document, 'fullscreenElement', {
        value: elemRef.current,
        configurable: true,
      })
      elemRef.current.requestFullscreen = jest.fn()
      elemRef.current.exitFullscreen = jest.fn()

      player.current.toggleFullscreen()

      expect(elemRef.current.exitFullscreen).toHaveBeenCalled()
      expect(elemRef.current.requestFullscreen).not.toHaveBeenCalled()
    })

    test('requestFullscreen falls back to vendor-prefixed methods', () => {
      const elem = {
        mozRequestFullScreen: jest.fn(),
      }
      player.current.requestFullscreen(elem)
      expect(elem.mozRequestFullScreen).toHaveBeenCalled()

      const elem2 = {
        webkitRequestFullscreen: jest.fn(),
      }
      player.current.requestFullscreen(elem2)
      expect(elem2.webkitRequestFullscreen).toHaveBeenCalled()

      const elem3 = {
        msRequestFullscreen: jest.fn(),
      }
      player.current.requestFullscreen(elem3)
      expect(elem3.msRequestFullscreen).toHaveBeenCalled()
    })

    test('exitFullscreen falls back to vendor-prefixed methods', () => {
      const elem = {
        mozCancelFullScreen: jest.fn(),
      }
      player.current.exitFullscreen(elem)
      expect(elem.mozCancelFullScreen).toHaveBeenCalled()

      const elem2 = {
        webkitExitFullscreen: jest.fn(),
      }
      player.current.exitFullscreen(elem2)
      expect(elem2.webkitExitFullscreen).toHaveBeenCalled()

      const elem3 = {
        msExitFullscreen: jest.fn(),
      }
      player.current.exitFullscreen(elem3)
      expect(elem3.msExitFullscreen).toHaveBeenCalled()
    })

    test('fullscreenElement checks vendor-prefixed properties', () => {
      Object.defineProperty(document, 'fullscreenElement', {
        value: undefined,
        configurable: true,
      })
      Object.defineProperty(document, 'webkitFullscreenElement', {
        value: 'webkit-elem',
        configurable: true,
      })

      expect(player.current.fullscreenElement()).toBe('webkit-elem')

      Object.defineProperty(document, 'webkitFullscreenElement', {
        value: undefined,
        configurable: true,
      })
    })
  })

  describe('handleLoad / handleEnded', () => {
    test('handleLoad reads properties from elemRef and updates state', () => {
      const elemRef = makeElemRef()
      elemRef.current.currentTime = 3
      elemRef.current.playbackRate = 1.5
      elemRef.current.loop = true
      elemRef.current.volume = 0.8
      // jsdom defines `duration` and `currentSrc` as getter-only properties
      // on HTMLMediaElement, so they must be redefined to set test values.
      Object.defineProperty(elemRef.current, 'duration', {
        value: 120,
        configurable: true,
      })
      Object.defineProperty(elemRef.current, 'currentSrc', {
        value: 'foo.mp3',
        configurable: true,
      })

      const props = baseProps({ elemRef, controls: 'simple' })

      const { player } = renderPlayer(props)

      act(() => {
        player.current.handleLoad()
      })

      expect(player.current.state.currentTime).toBe(3)
      expect(player.current.state.duration).toBe(120)
      expect(player.current.state.playbackRate).toBe(1.5)
      expect(player.current.state.loop).toBe(true)
      expect(player.current.state.volume).toBe(0.8)
      expect(player.current.state.currentSrc).toBe('foo.mp3')
      expect(player.current.state.timeRemaining).toBe('02:00')
      expect(elemRef.current.preload).toBe('auto')
    })

    test('handleEnded sets paused and userInitiatedPause to true', () => {
      const elemRef = makeElemRef()
      const props = baseProps({ elemRef, controls: 'simple' })

      const { player } = renderPlayer(props)

      act(() => {
        player.current.handleEnded()
      })

      expect(player.current.state.paused).toBe(true)
      expect(player.current.state.userInitiatedPause).toBe(true)
    })
  })

  describe('autoplay / spread-change behavior', () => {
    test('onCanPlay plays media when spread becomes current and autoPlay is on', async () => {
      const elemRef = makeElemRef()
      const props = baseProps({
        elemRef,
        controls: 'simple',
        spreadIndex: 1,
        'data-autoplay': true,
      })

      const { player, rerender } = renderPlayer(props, {
        ...defaultContext,
        spreadIndex: 0,
      })

      expect(player.current.state.autoPlay).toBe(true)
      expect(player.current.state.paused).toBe(true)

      // Simulate spread becoming current via a re-render with new context
      rerender(props, { ...defaultContext, spreadIndex: 1 })

      await act(async () => {
        player.current.onCanPlay({ spreadIndex: 1 }, { spreadIndex: 1 })
        await Promise.resolve()
        await Promise.resolve()
      })

      expect(player.current.state.paused).toBe(false)
      expect(elemRef.current.play).toHaveBeenCalled()
    })

    test('onCanPlay pauses media when spread changes away while playing', async () => {
      const elemRef = makeElemRef()
      const props = baseProps({
        elemRef,
        controls: 'simple',
        spreadIndex: 0,
        'data-autoplay': true,
      })

      const { player } = renderPlayer(props, {
        ...defaultContext,
        spreadIndex: 0,
      })

      // Simulate media currently playing
      act(() => {
        player.current.setState({ paused: false })
      })

      await act(async () => {
        player.current.onCanPlay({ spreadIndex: 0 }, { spreadIndex: 1 })
        await Promise.resolve()
      })

      expect(player.current.state.paused).toBe(true)
      expect(elemRef.current.pause).toHaveBeenCalled()
    })

    test('onCanPlay does nothing when not playable and not previously playing', () => {
      const elemRef = makeElemRef()
      const props = baseProps({
        elemRef,
        controls: 'simple',
        spreadIndex: 0,
        'data-autoplay': true,
      })

      const { player } = renderPlayer(props, {
        ...defaultContext,
        spreadIndex: 0,
      })

      // spreadIndex mismatch with paused already true: neither the play nor
      // pause branch should trigger
      act(() => {
        player.current.onCanPlay({ spreadIndex: 5 }, { spreadIndex: 6 })
      })

      expect(player.current.state.paused).toBe(true)
      expect(elemRef.current.play).not.toHaveBeenCalled()
      expect(elemRef.current.pause).not.toHaveBeenCalled()
    })

    test('registers a canplay listener on spread change when autoPlay is on', () => {
      const elemRef = makeElemRef()
      const addEventListenerSpy = jest.spyOn(
        elemRef.current,
        'addEventListener'
      )

      const props = baseProps({
        elemRef,
        controls: 'simple',
        spreadIndex: 0,
        'data-autoplay': true,
      })

      const { rerender } = renderPlayer(props, {
        ...defaultContext,
        spreadIndex: 0,
      })

      rerender(
        { ...props, spreadIndex: 1 },
        { ...defaultContext, spreadIndex: 1 }
      )

      expect(addEventListenerSpy).toHaveBeenCalledWith(
        'canplay',
        expect.any(Function)
      )
    })

    test('does nothing on spread change when autoPlay is false', () => {
      const elemRef = makeElemRef()
      const addEventListenerSpy = jest.spyOn(
        elemRef.current,
        'addEventListener'
      )

      const props = baseProps({
        elemRef,
        controls: 'simple',
        spreadIndex: 0,
      })

      const { rerender } = renderPlayer(props, {
        ...defaultContext,
        spreadIndex: 0,
      })

      rerender(
        { ...props, spreadIndex: 1 },
        { ...defaultContext, spreadIndex: 1 }
      )

      expect(addEventListenerSpy).not.toHaveBeenCalled()
    })
  })
})
