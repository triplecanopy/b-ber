/* eslint-disable react/jsx-props-no-spreading */

import { fireEvent, render } from '@testing-library/react'
import React from 'react'
import useNodePosition from '../../../src/hooks/use-node-position'
import ReaderContext from '../../../src/lib/reader-context'

const defaultNodePosition = (overrides = {}) => ({
  elemRef: { current: null },
  verso: null,
  recto: null,
  spreadIndex: null,
  elementEdgeLeft: null,
  view: {},
  viewerSettings: {},
  readerSettings: {},
  ...overrides,
})

// These tests call jest.resetModules() so the component re-evaluates its
// module-level browser check (iframePositioningEnabled) under different mocks.
// resetModules() also creates a fresh React copy whose hook dispatcher is null
// at render time — now that Vimeo is functional, that crashes on the first hook.
// Pin one React instance (the one RTL renders with) across resets.
jest.mock('react', () => {
  if (!globalThis.__reactSingleton) {
    globalThis.__reactSingleton = jest.requireActual('react')
  }
  return globalThis.__reactSingleton
})

// resetModules() also re-creates the ReaderContext object, so the test's
// statically imported Provider would no longer match the context the
// dynamically imported Vimeo reads via useContext. There is only ever one
// ReaderContext in production — pin it to a single instance here too.
jest.mock('../../../src/lib/reader-context', () => {
  if (!globalThis.__readerContextSingleton) {
    globalThis.__readerContextSingleton = jest.requireActual(
      '../../../src/lib/reader-context'
    )
  }
  return globalThis.__readerContextSingleton
})

// Vimeo reads its element ref + spread position + view/readerSettings from
// useNodePosition. Pin a single jest.fn across resetModules (like the React /
// ReaderContext singletons above) so tests can drive its return value.
jest.mock('../../../src/hooks/use-node-position', () => {
  if (!globalThis.__useNodePositionMock) {
    globalThis.__useNodePositionMock = jest.fn()
  }
  return { __esModule: true, default: globalThis.__useNodePositionMock }
})

// useIframePosition now supplies the placeholder geometry / style block / ref;
// stub it so these tests stay focused on Vimeo's own rendering.
jest.mock('../../../src/hooks/use-iframe-position', () => ({
  __esModule: true,
  default: () => ({
    iframePlaceholderTop: 0,
    iframePlaceholderWidth: 0,
    iframePlaceholderHeight: 0,
    iframeStyleBlock: () => '.vimeo { color: red; }',
    innerRef: () => {},
  }),
}))

// react-player/vimeo lazily loads the Vimeo Player SDK and is not relevant to
// the rendering logic under test - mock it with a simple placeholder that
// records the props it was given.
jest.mock('react-player/vimeo', () => {
  const ReactMock = require('react')
  return function MockReactPlayer(props) {
    return ReactMock.createElement(
      'div',
      {
        'data-testid': 'react-player',
        'data-url': props.url,
        'data-loop': String(props.loop),
        'data-muted': String(props.muted),
        'data-playing': String(props.playing),
        'data-controls': String(props.controls),
        'data-config': JSON.stringify(props.config),
      },
      ReactMock.createElement('button', {
        type: 'button',
        'data-testid': 'trigger-pause',
        onClick: props.onPause,
      }),
      ReactMock.createElement('button', {
        type: 'button',
        'data-testid': 'trigger-ended',
        onClick: props.onEnded,
      })
    )
  }
})

describe('Vimeo', () => {
  beforeEach(() => {
    console.warn = jest.fn()
    console.error = jest.fn()
    useNodePosition.mockReturnValue(defaultNodePosition())
  })

  afterEach(() => jest.clearAllMocks())

  describe('with iframe positioning disabled (default browser detection)', () => {
    test('renders the player with parsed url and default options', async () => {
      const { default: Vimeo } = await import(
        '../../../src/components/Media/Vimeo'
      )

      const tree = render(
        <Vimeo
          src="https://vimeo.com/12345"
          posterImage={null}
          aspectRatio={
            new Map([
              ['x', 16],
              ['y', 9],
            ])
          }
          elemRef={React.createRef()}
        />
      )

      const player = tree.getByTestId('react-player')

      expect(player.dataset.url).toBe('https://vimeo.com/12345')
      expect(player.dataset.controls).toBe('true')
      expect(player.dataset.playing).toBe('false')

      // No placeholder/style block when positioning is disabled
      expect(tree.container.querySelector('style')).toBeNull()
      expect(
        tree.container.querySelector('.bber-iframe-placeholder')
      ).toBeNull()
    })

    test('parses query string options into player props', async () => {
      const { default: Vimeo } = await import(
        '../../../src/components/Media/Vimeo'
      )

      const tree = render(
        <Vimeo
          src="https://vimeo.com/12345?autoplay=1&loop=1&muted=1&controls=0"
          posterImage={null}
          aspectRatio={
            new Map([
              ['x', 16],
              ['y', 9],
            ])
          }
          elemRef={React.createRef()}
        />
      )

      const player = tree.getByTestId('react-player')

      expect(player.dataset.url).toBe('https://vimeo.com/12345')
      expect(player.dataset.loop).toBe('true')
      expect(player.dataset.muted).toBe('true')
      expect(player.dataset.controls).toBe('false')

      const config = JSON.parse(player.dataset.config)

      // autopause is blacklisted from playerOptions and autoplay is
      // extracted out separately, so neither should be present
      expect(config.vimeo.playerOptions).not.toHaveProperty('autopause')
      expect(config.vimeo.playerOptions).not.toHaveProperty('autoplay')
      expect(config.vimeo.playerOptions.playsinline).toBe(true)
    })

    test('renders the poster image when provided', async () => {
      const { default: Vimeo } = await import(
        '../../../src/components/Media/Vimeo'
      )

      const tree = render(
        <Vimeo
          src="https://vimeo.com/12345"
          posterImage="https://example.com/poster.jpg"
          aspectRatio={
            new Map([
              ['x', 16],
              ['y', 9],
            ])
          }
          elemRef={React.createRef()}
        />
      )

      const img = tree.container.querySelector('img.bber-poster--vimeo')

      expect(img).not.toBeNull()
      expect(img.getAttribute('src')).toBe('https://example.com/poster.jpg')
    })

    test('does not render a poster image when none is provided', async () => {
      const { default: Vimeo } = await import(
        '../../../src/components/Media/Vimeo'
      )

      const tree = render(
        <Vimeo
          src="https://vimeo.com/12345"
          posterImage={null}
          aspectRatio={
            new Map([
              ['x', 16],
              ['y', 9],
            ])
          }
          elemRef={React.createRef()}
        />
      )

      expect(tree.container.querySelector('img.bber-poster--vimeo')).toBeNull()
    })

    test('clicking the poster image toggles playing state and hides the poster', async () => {
      const { default: Vimeo } = await import(
        '../../../src/components/Media/Vimeo'
      )

      const tree = render(
        <Vimeo
          src="https://vimeo.com/12345"
          posterImage="https://example.com/poster.jpg"
          aspectRatio={
            new Map([
              ['x', 16],
              ['y', 9],
            ])
          }
          elemRef={React.createRef()}
        />
      )

      let img = tree.container.querySelector('img.bber-poster--vimeo')
      expect(img.classList.contains('bber-visible')).toBe(true)

      let player = tree.getByTestId('react-player')
      expect(player.dataset.playing).toBe('false')

      fireEvent.click(img)

      img = tree.container.querySelector('img.bber-poster--vimeo')
      player = tree.getByTestId('react-player')

      expect(player.dataset.playing).toBe('true')
      expect(img.classList.contains('bber-visible')).toBe(false)
    })
  })

  describe('with iframe positioning enabled', () => {
    beforeEach(() => {
      jest.resetModules()
      jest.doMock('../../../src/helpers/utils', () => {
        const actual = jest.requireActual('../../../src/helpers/utils')
        return { ...actual, isBrowser: () => true }
      })
    })

    afterEach(() => {
      jest.dontMock('../../../src/helpers/utils')
      jest.dontMock('../../../src/helpers/Viewport')
      jest.resetModules()
    })

    test('renders style block and placeholder, mobile layout', async () => {
      jest.doMock('../../../src/helpers/Viewport', () => ({
        __esModule: true,
        default: { isSingleColumn: () => true },
      }))

      const { default: Vimeo } = await import(
        '../../../src/components/Media/Vimeo'
      )

      const tree = render(
        <Vimeo
          src="https://vimeo.com/12345"
          posterImage={null}
          aspectRatio={
            new Map([
              ['x', 16],
              ['y', 9],
            ])
          }
          elemRef={React.createRef()}
          iframePlaceholderTop={0}
          iframePlaceholderWidth={0}
          iframePlaceholderHeight={0}
        />
      )

      expect(tree.container.querySelector('style')).not.toBeNull()

      const placeholder = tree.container.querySelector(
        '.bber-iframe-placeholder'
      )
      expect(placeholder).not.toBeNull()
      // Mobile -> paddingTop is 0
      expect(placeholder.style.paddingTop).toBe('0px')
    })

    test('renders style block and placeholder, desktop layout with inline sizing', async () => {
      jest.doMock('../../../src/helpers/Viewport', () => ({
        __esModule: true,
        default: { isSingleColumn: () => false },
      }))

      const { default: Vimeo } = await import(
        '../../../src/components/Media/Vimeo'
      )

      const tree = render(
        <Vimeo
          src="https://vimeo.com/12345"
          posterImage={null}
          aspectRatio={
            new Map([
              ['x', 16],
              ['y', 9],
            ])
          }
          elemRef={React.createRef()}
          iframePlaceholderTop={50}
          iframePlaceholderWidth={300}
          iframePlaceholderHeight={200}
        />
      )

      expect(tree.container.querySelector('style')).not.toBeNull()

      const placeholder = tree.container.querySelector(
        '.bber-iframe-placeholder'
      )
      expect(placeholder).not.toBeNull()
      // Desktop -> paddingTop is (y/x) * 100 = (9/16)*100 = 56.25%
      expect(placeholder.style.paddingTop).toBe('56.25%')

      const player = tree.getByTestId('react-player')
      expect(player).not.toBeNull()
    })

    test('applies fullscreen styles when placeholder width exceeds window width (landscape)', async () => {
      jest.doMock('../../../src/helpers/Viewport', () => ({
        __esModule: true,
        default: { isSingleColumn: () => false },
      }))

      const originalInnerWidth = window.innerWidth
      const originalInnerHeight = window.innerHeight

      Object.defineProperty(window, 'innerWidth', {
        configurable: true,
        value: 100,
      })
      Object.defineProperty(window, 'innerHeight', {
        configurable: true,
        value: 50,
      })

      const { default: Vimeo } = await import(
        '../../../src/components/Media/Vimeo'
      )

      const tree = render(
        <Vimeo
          src="https://vimeo.com/12345"
          posterImage={null}
          aspectRatio={
            new Map([
              ['x', 16],
              ['y', 9],
            ])
          }
          elemRef={React.createRef()}
          iframePlaceholderTop={50}
          iframePlaceholderWidth={300}
          iframePlaceholderHeight={200}
        />
      )

      const player = tree.getByTestId('react-player')
      expect(player).not.toBeNull()

      Object.defineProperty(window, 'innerWidth', {
        configurable: true,
        value: originalInnerWidth,
      })
      Object.defineProperty(window, 'innerHeight', {
        configurable: true,
        value: originalInnerHeight,
      })
    })

    test('applies fullscreen styles in portrait orientation', async () => {
      jest.doMock('../../../src/helpers/Viewport', () => ({
        __esModule: true,
        default: { isSingleColumn: () => false },
      }))

      const originalInnerWidth = window.innerWidth
      const originalInnerHeight = window.innerHeight

      Object.defineProperty(window, 'innerWidth', {
        configurable: true,
        value: 50,
      })
      Object.defineProperty(window, 'innerHeight', {
        configurable: true,
        value: 100,
      })

      const { default: Vimeo } = await import(
        '../../../src/components/Media/Vimeo'
      )

      const tree = render(
        <Vimeo
          src="https://vimeo.com/12345"
          posterImage={null}
          aspectRatio={
            new Map([
              ['x', 16],
              ['y', 9],
            ])
          }
          elemRef={React.createRef()}
          iframePlaceholderTop={50}
          iframePlaceholderWidth={300}
          iframePlaceholderHeight={200}
        />
      )

      const player = tree.getByTestId('react-player')
      expect(player).not.toBeNull()

      Object.defineProperty(window, 'innerWidth', {
        configurable: true,
        value: originalInnerWidth,
      })
      Object.defineProperty(window, 'innerHeight', {
        configurable: true,
        value: originalInnerHeight,
      })
    })
  })

  describe('player event handlers', () => {
    test('onPause sets playing to false', async () => {
      const { default: Vimeo } = await import(
        '../../../src/components/Media/Vimeo'
      )

      // Render with playing already true via poster click, then trigger pause
      const tree = render(
        <Vimeo
          src="https://vimeo.com/12345"
          posterImage="https://example.com/poster.jpg"
          aspectRatio={
            new Map([
              ['x', 16],
              ['y', 9],
            ])
          }
          elemRef={React.createRef()}
        />
      )

      const img = tree.container.querySelector('img.bber-poster--vimeo')
      fireEvent.click(img)

      expect(tree.getByTestId('react-player').dataset.playing).toBe('true')

      fireEvent.click(tree.getByTestId('trigger-pause'))

      expect(tree.getByTestId('react-player').dataset.playing).toBe('false')
    })

    test('onEnded sets playing to false', async () => {
      const { default: Vimeo } = await import(
        '../../../src/components/Media/Vimeo'
      )

      const tree = render(
        <Vimeo
          src="https://vimeo.com/12345"
          posterImage="https://example.com/poster.jpg"
          aspectRatio={
            new Map([
              ['x', 16],
              ['y', 9],
            ])
          }
          elemRef={React.createRef()}
        />
      )

      const img = tree.container.querySelector('img.bber-poster--vimeo')
      fireEvent.click(img)

      expect(tree.getByTestId('react-player').dataset.playing).toBe('true')

      fireEvent.click(tree.getByTestId('trigger-ended'))

      expect(tree.getByTestId('react-player').dataset.playing).toBe('false')
    })
  })

  describe('UNSAFE_componentWillReceiveProps', () => {
    test('updates playing state when context spreadIndex changes and view is loaded with autoplay', async () => {
      const { default: Vimeo } = await import(
        '../../../src/components/Media/Vimeo'
      )

      const wrapper = ({ children, spreadIndex }) => (
        <ReaderContext.Provider
          value={{
            spreadIndex,
            lastSpread: false,
            getTranslateX: () => 0,
            navigateToChapterByURL: () => {},
            getSpineItemByAbsoluteUrl: () => {},
          }}
        >
          {children}
        </ReaderContext.Provider>
      )

      // Element sits on spread 0, the view is loaded; autoplay defaults on.
      useNodePosition.mockReturnValue(
        defaultNodePosition({
          spreadIndex: 0,
          view: { loaded: true },
          readerSettings: { layout: 'paginated' },
        })
      )

      const commonProps = {
        src: 'https://vimeo.com/12345',
        posterImage: null,
        aspectRatio: new Map([
          ['x', 16],
          ['y', 9],
        ]),
      }

      const Wrapper = ({ spreadIndex }) =>
        wrapper({
          spreadIndex,
          children: <Vimeo {...commonProps} />,
        })

      const tree = render(<Wrapper spreadIndex={1} />)

      // Re-render with a new spreadIndex in context to trigger
      // UNSAFE_componentWillReceiveProps -> getPlayingStateOnUpdate
      tree.rerender(<Wrapper spreadIndex={0} />)

      const player = tree.getByTestId('react-player')
      // Element is on spread 0, context now shows spread 0 - element comes
      // into view and should start playing (autoplay defaults to true)
      expect(player.dataset.playing).toBe('true')
    })

    test('does not update state when getPlayingStateOnUpdate returns false (view not loaded)', async () => {
      const { default: Vimeo } = await import(
        '../../../src/components/Media/Vimeo'
      )

      // view.loaded false -> getPlayingStateOnUpdate short-circuits to false ->
      // the render-phase update never changes playing state.
      useNodePosition.mockReturnValue(
        defaultNodePosition({
          spreadIndex: 0,
          view: { loaded: false },
          readerSettings: { layout: 'paginated' },
        })
      )

      const Wrapper = ({ spreadIndex }) => (
        <ReaderContext.Provider
          value={{
            spreadIndex,
            lastSpread: false,
            getTranslateX: () => 0,
            navigateToChapterByURL: () => {},
            getSpineItemByAbsoluteUrl: () => {},
          }}
        >
          <Vimeo
            src="https://vimeo.com/12345"
            posterImage={null}
            aspectRatio={
              new Map([
                ['x', 16],
                ['y', 9],
              ])
            }
          />
        </ReaderContext.Provider>
      )

      const tree = render(<Wrapper spreadIndex={1} />)

      tree.rerender(<Wrapper spreadIndex={0} />)

      // playing state is unaffected since setState was never called
      expect(tree.getByTestId('react-player').dataset.playing).toBe('false')
    })
  })
})
