/* eslint-disable react/jsx-props-no-spreading */

import { fireEvent, render } from '@testing-library/react'
import React from 'react'
import Vimeo from '../../../src/components/Media/Vimeo'
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

// useNodePosition supplies Vimeo's element ref + spread position +
// view/readerSettings; mock it so these tests don't need a store or a measured
// viewport. Tests drive its return value via useNodePosition.mockReturnValue.
jest.mock('../../../src/hooks/use-node-position', () => ({
  __esModule: true,
  default: jest.fn(),
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

  describe('rendering', () => {
    test('renders the player with parsed url and default options', async () => {
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

  describe('player event handlers', () => {
    test('onPause sets playing to false', async () => {
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
