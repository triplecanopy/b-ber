/* eslint-disable react/jsx-props-no-spreading */

import { act, render } from '@testing-library/react'
import React from 'react'
import Media from '../../../src/components/Media/Media'
import ReaderContext from '../../../src/lib/reader-context'

jest.mock(
  '../../../src/lib/with-node-position',
  () => (WrappedComponent) => (props) => <WrappedComponent {...props} />
)

const MediaComponentStub = React.forwardRef((props, ref) => (
  // eslint-disable-next-line jsx-a11y/media-has-caption
  <audio ref={ref} data-testid="media-el" {...props} />
))

const baseProps = (overrides = {}) => ({
  id: 'media-1',
  mediaType: 'audio',
  MediaComponent: MediaComponentStub,
  view: {},
  viewerSettings: {},
  readerSettings: {},
  currentSpreadIndex: 0,
  spreadIndex: 0,
  verso: false,
  recto: false,
  elementEdgeLeft: 0,
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

describe('Media', () => {
  beforeEach(() => {
    console.warn = jest.fn()
    console.error = jest.fn()
  })

  afterEach(() => {
    jest.clearAllMocks()
    jest.useRealTimers()
  })

  test('renders without controls when controls attribute is falsy', () => {
    const elemRef = makeElemRef()
    const props = baseProps({ elemRef, controls: undefined })

    const tree = renderMedia(props, defaultContext)

    expect(tree.getByTestId('media-el')).toBeTruthy()
  })

  test('renders with config when controls matches a preset', () => {
    const elemRef = makeElemRef()
    const props = baseProps({ elemRef, controls: 'simple' })

    const tree = renderMedia(props, defaultContext)

    expect(
      tree.container.querySelector('.bber-media__controls--simple')
    ).toBeTruthy()
  })

  test('renders default browser controls when controls is not a preset', () => {
    const elemRef = makeElemRef()
    const props = baseProps({ elemRef, controls: true })

    const tree = renderMedia(props, defaultContext)

    expect(tree.getByTestId('media-el')).toBeTruthy()
    // No MediaControls config rendered since `controls` isn't a preset string
    expect(tree.container.querySelector('.bber-media__controls')).toBeFalsy()
  })

  test('UNSAFE_componentWillMount sets autoPlay state when data-autoplay is true', () => {
    const elemRef = makeElemRef()
    const props = baseProps({
      elemRef,
      controls: 'simple',
      'data-autoplay': true,
    })

    let instance
    render(
      <ReaderContext.Provider value={defaultContext}>
        <Media
          ref={(el) => {
            instance = el
          }}
          {...props}
        />
      </ReaderContext.Provider>
    )

    expect(instance.state.autoPlay).toBe(true)
  })

  test('play() sets paused/userInitiatedPause and calls elemRef.play', async () => {
    const elemRef = makeElemRef()
    const props = baseProps({ elemRef, controls: 'simple' })

    let instance
    const refCb = (el) => {
      instance = el
    }

    render(
      <ReaderContext.Provider value={defaultContext}>
        <Media ref={refCb} {...props} />
      </ReaderContext.Provider>
    )

    await act(async () => {
      instance.play()
    })

    expect(instance.state.paused).toBe(false)
    expect(instance.state.userInitiatedPause).toBe(false)
    expect(elemRef.current.play).toHaveBeenCalled()
  })

  test('pause() sets paused/userInitiatedPause and calls elemRef.pause', async () => {
    const elemRef = makeElemRef()
    const props = baseProps({ elemRef, controls: 'simple' })

    let instance
    render(
      <ReaderContext.Provider value={defaultContext}>
        <Media
          ref={(el) => {
            instance = el
          }}
          {...props}
        />
      </ReaderContext.Provider>
    )

    await act(async () => {
      instance.pause()
    })

    expect(instance.state.paused).toBe(true)
    expect(instance.state.userInitiatedPause).toBe(true)
    expect(elemRef.current.pause).toHaveBeenCalled()
  })

  test('playMedia handles a play() promise rejection silently', async () => {
    const elemRef = makeElemRef()
    elemRef.current.play = jest.fn().mockRejectedValue(new Error('nope'))

    const props = baseProps({ elemRef, controls: 'simple' })

    let instance
    render(
      <ReaderContext.Provider value={defaultContext}>
        <Media
          ref={(el) => {
            instance = el
          }}
          {...props}
        />
      </ReaderContext.Provider>
    )

    await act(async () => {
      instance.playMedia()
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

    let instance
    render(
      <ReaderContext.Provider value={defaultContext}>
        <Media
          ref={(el) => {
            instance = el
          }}
          {...props}
        />
      </ReaderContext.Provider>
    )

    instance.state.paused = true
    expect(() => instance.playMedia()).not.toThrow()
    expect(elemRef.current.play).toHaveBeenCalled()
  })

  describe('updateTime / timeForward / timeBack / seek', () => {
    let elemRef
    let instance

    beforeEach(() => {
      elemRef = makeElemRef()
      const props = baseProps({ elemRef, controls: 'simple' })

      render(
        <ReaderContext.Provider value={defaultContext}>
          <Media
            ref={(el) => {
              instance = el
            }}
            {...props}
          />
        </ReaderContext.Provider>
      )

      // Ensure paused so updateControlsUI doesn't recursively schedule
      act(() => {
        instance.setState({ duration: 100, currentTime: 50, paused: true })
      })
    })

    test('timeForward advances currentTime by skipStep, clamped to duration', () => {
      act(() => {
        instance.timeForward()
      })

      expect(instance.state.currentTime).toBe(80)
      expect(elemRef.current.currentTime).toBe(80)
    })

    test('timeBack decreases currentTime by skipStep, clamped to 0', () => {
      act(() => {
        instance.setState({ currentTime: 10 })
      })
      act(() => {
        instance.timeBack()
      })

      expect(instance.state.currentTime).toBe(0)
      expect(elemRef.current.currentTime).toBe(0)
    })

    test('updateTime clamps currentTime to duration upper bound', () => {
      act(() => {
        instance.setState({ currentTime: 95, duration: 100 })
      })
      act(() => {
        instance.updateTime(30)
      })

      expect(instance.state.currentTime).toBe(100)
    })

    test('seek sets progress and currentTime from event target value', () => {
      act(() => {
        instance.seek({ target: { value: '42' } })
      })

      expect(instance.state.progress).toBe(42)
      expect(instance.state.currentTime).toBe(42)
      expect(elemRef.current.currentTime).toBe(42)
    })
  })

  describe('updateVolume / updateLoop / updatePlaybackRate', () => {
    let elemRef
    let instance

    beforeEach(() => {
      elemRef = makeElemRef()
      const props = baseProps({ elemRef, controls: 'simple' })

      render(
        <ReaderContext.Provider value={defaultContext}>
          <Media
            ref={(el) => {
              instance = el
            }}
            {...props}
          />
        </ReaderContext.Provider>
      )
    })

    test('updateVolume updates state and elemRef.volume', () => {
      act(() => {
        instance.updateVolume({ currentTarget: { value: '0.5' } })
      })

      expect(instance.state.volume).toBe('0.5')
      expect(elemRef.current.volume).toBe(0.5)
    })

    test('updateLoop toggles loop state and elemRef.loop', () => {
      expect(instance.state.loop).toBe(false)

      act(() => {
        instance.updateLoop()
      })

      expect(instance.state.loop).toBe(true)
      expect(elemRef.current.loop).toBe(true)

      act(() => {
        instance.updateLoop()
      })

      expect(instance.state.loop).toBe(false)
      expect(elemRef.current.loop).toBe(false)
    })

    test('updatePlaybackRate updates state and elemRef.playbackRate', () => {
      act(() => {
        instance.updatePlaybackRate(1.5)
      })

      expect(instance.state.playbackRate).toBe(1.5)
      expect(elemRef.current.playbackRate).toBe(1.5)
    })
  })

  describe('displayTime', () => {
    let instance

    beforeEach(() => {
      const elemRef = makeElemRef()
      const props = baseProps({ elemRef, controls: 'simple' })

      render(
        <ReaderContext.Provider value={defaultContext}>
          <Media
            ref={(el) => {
              instance = el
            }}
            {...props}
          />
        </ReaderContext.Provider>
      )
    })

    test('formats seconds as MM:SS with zero-padding', () => {
      expect(instance.displayTime(5)).toBe('00:05')
      expect(instance.displayTime(65)).toBe('01:05')
      expect(instance.displayTime(3600)).toBe('60:00')
      expect(instance.displayTime(0)).toBe('00:00')
    })
  })

  describe('updateControlsUI / updateTimeStamps / updateProgress', () => {
    test('updateTimeStamps and updateProgress read from elemRef and update state', () => {
      const elemRef = makeElemRef()
      elemRef.current.currentTime = 12

      const props = baseProps({ elemRef, controls: 'simple' })

      let instance
      render(
        <ReaderContext.Provider value={defaultContext}>
          <Media
            ref={(el) => {
              instance = el
            }}
            {...props}
          />
        </ReaderContext.Provider>
      )

      act(() => {
        instance.updateTimeStamps()
      })
      expect(instance.state.currentTime).toBe(12)
      expect(instance.state.timeElapsed).toBe('00:12')

      act(() => {
        instance.updateProgress()
      })
      expect(instance.state.progress).toBe(12)
    })

    test('updateTimeStamps and updateProgress no-op when elemRef.current is missing', () => {
      const elemRef = makeElemRef()
      const props = baseProps({ elemRef, controls: 'simple' })

      let instance
      render(
        <ReaderContext.Provider value={defaultContext}>
          <Media
            ref={(el) => {
              instance = el
            }}
            {...props}
          />
        </ReaderContext.Provider>
      )

      elemRef.current = null

      expect(() => instance.updateTimeStamps()).not.toThrow()
      expect(() => instance.updateProgress()).not.toThrow()
    })

    test('updateControlsUI schedules a recursive setTimeout while playing', () => {
      jest.useFakeTimers()

      const elemRef = makeElemRef()
      elemRef.current.currentTime = 5

      const props = baseProps({ elemRef, controls: 'simple' })

      let instance
      render(
        <ReaderContext.Provider value={defaultContext}>
          <Media
            ref={(el) => {
              instance = el
            }}
            {...props}
          />
        </ReaderContext.Provider>
      )

      act(() => {
        instance.setState({ paused: false })
      })

      const setTimeoutSpy = jest.spyOn(global, 'setTimeout')

      act(() => {
        instance.updateControlsUI()
      })

      expect(setTimeoutSpy).toHaveBeenCalledWith(expect.any(Function), 1000)

      setTimeoutSpy.mockRestore()
    })

    test('updateControlsUI does not schedule when paused', () => {
      jest.useFakeTimers()

      const elemRef = makeElemRef()
      const props = baseProps({ elemRef, controls: 'simple' })

      let instance
      render(
        <ReaderContext.Provider value={defaultContext}>
          <Media
            ref={(el) => {
              instance = el
            }}
            {...props}
          />
        </ReaderContext.Provider>
      )

      act(() => {
        instance.setState({ paused: true })
      })

      const setTimeoutSpy = jest.spyOn(global, 'setTimeout')

      act(() => {
        instance.updateControlsUI()
      })

      expect(setTimeoutSpy).not.toHaveBeenCalled()

      setTimeoutSpy.mockRestore()
    })

    test('updateControlsUI does not schedule when elemRef.current is missing', () => {
      jest.useFakeTimers()

      const elemRef = makeElemRef()
      const props = baseProps({ elemRef, controls: 'simple' })

      let instance
      render(
        <ReaderContext.Provider value={defaultContext}>
          <Media
            ref={(el) => {
              instance = el
            }}
            {...props}
          />
        </ReaderContext.Provider>
      )

      act(() => {
        instance.setState({ paused: false })
      })

      elemRef.current = null

      const setTimeoutSpy = jest.spyOn(global, 'setTimeout')

      act(() => {
        instance.updateControlsUI()
      })

      expect(setTimeoutSpy).not.toHaveBeenCalled()

      setTimeoutSpy.mockRestore()
    })
  })

  describe('fullscreen handling', () => {
    let elemRef
    let instance

    beforeEach(() => {
      elemRef = makeElemRef('video')
      const props = baseProps({
        elemRef,
        mediaType: 'video',
        controls: 'simple',
      })

      render(
        <ReaderContext.Provider value={defaultContext}>
          <Media
            ref={(el) => {
              instance = el
            }}
            {...props}
          />
        </ReaderContext.Provider>
      )
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

      instance.toggleFullscreen()

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

      instance.toggleFullscreen()

      expect(elemRef.current.exitFullscreen).toHaveBeenCalled()
      expect(elemRef.current.requestFullscreen).not.toHaveBeenCalled()
    })

    test('requestFullscreen falls back to vendor-prefixed methods', () => {
      const elem = {
        mozRequestFullScreen: jest.fn(),
      }
      instance.requestFullscreen(elem)
      expect(elem.mozRequestFullScreen).toHaveBeenCalled()

      const elem2 = {
        webkitRequestFullscreen: jest.fn(),
      }
      instance.requestFullscreen(elem2)
      expect(elem2.webkitRequestFullscreen).toHaveBeenCalled()

      const elem3 = {
        msRequestFullscreen: jest.fn(),
      }
      instance.requestFullscreen(elem3)
      expect(elem3.msRequestFullscreen).toHaveBeenCalled()
    })

    test('exitFullscreen falls back to vendor-prefixed methods', () => {
      const elem = {
        mozCancelFullScreen: jest.fn(),
      }
      instance.exitFullscreen(elem)
      expect(elem.mozCancelFullScreen).toHaveBeenCalled()

      const elem2 = {
        webkitExitFullscreen: jest.fn(),
      }
      instance.exitFullscreen(elem2)
      expect(elem2.webkitExitFullscreen).toHaveBeenCalled()

      const elem3 = {
        msExitFullscreen: jest.fn(),
      }
      instance.exitFullscreen(elem3)
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

      expect(instance.fullscreenElement()).toBe('webkit-elem')

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

      let instance
      render(
        <ReaderContext.Provider value={defaultContext}>
          <Media
            ref={(el) => {
              instance = el
            }}
            {...props}
          />
        </ReaderContext.Provider>
      )

      act(() => {
        instance.handleLoad()
      })

      expect(instance.state.currentTime).toBe(3)
      expect(instance.state.duration).toBe(120)
      expect(instance.state.playbackRate).toBe(1.5)
      expect(instance.state.loop).toBe(true)
      expect(instance.state.volume).toBe(0.8)
      expect(instance.state.currentSrc).toBe('foo.mp3')
      expect(instance.state.timeRemaining).toBe('02:00')
      expect(elemRef.current.preload).toBe('auto')
    })

    test('handleEnded sets paused and userInitiatedPause to true', () => {
      const elemRef = makeElemRef()
      const props = baseProps({ elemRef, controls: 'simple' })

      let instance
      render(
        <ReaderContext.Provider value={defaultContext}>
          <Media
            ref={(el) => {
              instance = el
            }}
            {...props}
          />
        </ReaderContext.Provider>
      )

      act(() => {
        instance.handleEnded()
      })

      expect(instance.state.paused).toBe(true)
      expect(instance.state.userInitiatedPause).toBe(true)
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

      let instance
      const tree = render(
        <ReaderContext.Provider value={{ ...defaultContext, spreadIndex: 0 }}>
          <Media
            ref={(el) => {
              instance = el
            }}
            {...props}
          />
        </ReaderContext.Provider>
      )

      expect(instance.state.autoPlay).toBe(true)
      expect(instance.state.paused).toBe(true)

      // Simulate spread becoming current via a re-render with new context
      tree.rerender(
        <ReaderContext.Provider value={{ ...defaultContext, spreadIndex: 1 }}>
          <Media
            ref={(el) => {
              instance = el
            }}
            {...props}
          />
        </ReaderContext.Provider>
      )

      await act(async () => {
        instance.onCanPlay({ spreadIndex: 1 }, { spreadIndex: 1 })
        await Promise.resolve()
        await Promise.resolve()
      })

      expect(instance.state.paused).toBe(false)
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

      let instance
      render(
        <ReaderContext.Provider value={{ ...defaultContext, spreadIndex: 0 }}>
          <Media
            ref={(el) => {
              instance = el
            }}
            {...props}
          />
        </ReaderContext.Provider>
      )

      // Simulate media currently playing
      act(() => {
        instance.setState({ paused: false })
      })

      await act(async () => {
        instance.onCanPlay({ spreadIndex: 0 }, { spreadIndex: 1 })
        await Promise.resolve()
      })

      expect(instance.state.paused).toBe(true)
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

      let instance
      render(
        <ReaderContext.Provider value={{ ...defaultContext, spreadIndex: 0 }}>
          <Media
            ref={(el) => {
              instance = el
            }}
            {...props}
          />
        </ReaderContext.Provider>
      )

      // spreadIndex mismatch with paused already true: neither the play nor
      // pause branch should trigger
      act(() => {
        instance.onCanPlay({ spreadIndex: 5 }, { spreadIndex: 6 })
      })

      expect(instance.state.paused).toBe(true)
      expect(elemRef.current.play).not.toHaveBeenCalled()
      expect(elemRef.current.pause).not.toHaveBeenCalled()
    })

    test('UNSAFE_componentWillReceiveProps registers a canplay listener when autoPlay is on', () => {
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

      const tree = renderMedia(props, { ...defaultContext, spreadIndex: 0 })

      tree.rerender(
        <ReaderContext.Provider value={{ ...defaultContext, spreadIndex: 1 }}>
          <Media {...{ ...props, spreadIndex: 1 }} />
        </ReaderContext.Provider>
      )

      expect(addEventListenerSpy).toHaveBeenCalledWith(
        'canplay',
        expect.any(Function)
      )
    })

    test('UNSAFE_componentWillReceiveProps does nothing when autoPlay is false', () => {
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

      const tree = renderMedia(props, { ...defaultContext, spreadIndex: 0 })

      tree.rerender(
        <ReaderContext.Provider value={{ ...defaultContext, spreadIndex: 1 }}>
          <Media {...{ ...props, spreadIndex: 1 }} />
        </ReaderContext.Provider>
      )

      expect(addEventListenerSpy).not.toHaveBeenCalled()
    })
  })
})
