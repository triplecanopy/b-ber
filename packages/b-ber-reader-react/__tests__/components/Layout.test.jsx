/**
 * Tests for Layout.jsx — the CSS-columns layout container that renders
 * BookContent and the left/right "leaf" overlays, and reacts to window
 * resize / spreadIndex changes by recomputing the translateX transform.
 *
 * Strategy: withDimensions and withLastSpreadIndex are mocked as pass-through
 * HOCs (same pattern as with-node-position in Media/Vimeo.test.jsx) so props
 * like getFrameHeight/updateDimensions can be supplied directly and asserted
 * on, without needing a real Redux-measured viewport. The `userInterface`
 * slice still comes from the real connect()/store since that HOC is not
 * mocked.
 */

import { act, render } from '@testing-library/react'
import React from 'react'
import { Provider } from 'react-redux'
import Layout from '../../src/components/Layout'
import { RESIZE_DEBOUNCE_TIMER } from '../../src/constants'
import Viewport from '../../src/helpers/Viewport'
import browser from '../../src/lib/browser'
import ReaderContext from '../../src/lib/reader-context'
import { createTestStore } from '../helpers/store'

jest.mock(
  '../../src/lib/with-dimensions',
  () => (WrappedComponent) => (props) => <WrappedComponent {...props} />
)

jest.mock(
  '../../src/lib/with-last-spread-index',
  () => (WrappedComponent) => (props) => <WrappedComponent {...props} />
)

// detect-browser returns null in jsdom, so `browser.name` would throw inside
// getLeafStyles. Mock the module to provide a controllable `name`.
jest.mock('../../src/lib/browser', () => ({ name: 'chrome' }))

const baseViewerSettings = {
  width: 1000,
  height: 800,
  columns: 2,
  columnGap: 40,
  paddingTop: 20,
  paddingLeft: 30,
  paddingRight: 30,
  paddingBottom: 20,
  fontSize: '100%',
  transition: 'slide',
  transitionSpeed: 400,
}

function BookContent() {
  return <div data-testid="book-content" />
}

function renderLayout(props = {}, overrides = {}, contextOverrides = {}) {
  const store = createTestStore(overrides)

  const defaultProps = {
    getFrameHeight: jest.fn(() => 760),
    updateDimensions: jest.fn(),
    viewerSettings: baseViewerSettings,
    layout: 'columns',
    slug: 'chapter-1',
    spreadIndex: 0,
    spineItemURL: 'chapter-1.xhtml',
    lastSpreadIndex: 2,
    BookContent,
    innerRef: { current: null },
    ...props,
  }

  const context = {
    lastSpread: false,
    spreadIndex: 0,
    getTranslateX: jest.fn(() => 0),
    navigateToChapterByURL: jest.fn(),
    getSpineItemByAbsoluteUrl: jest.fn(),
    ...contextOverrides,
  }

  const utils = render(
    <Provider store={store}>
      <ReaderContext.Provider value={context}>
        <Layout {...defaultProps} />
      </ReaderContext.Provider>
    </Provider>
  )

  return { store, context, ...utils }
}

describe('Layout', () => {
  afterEach(() => {
    jest.restoreAllMocks()
  })

  test('renders #layout with #content and BookContent', () => {
    const { container, getByTestId } = renderLayout()

    expect(container.querySelector('#layout')).toBeTruthy()
    expect(container.querySelector('#content')).toBeTruthy()
    expect(getByTestId('book-content')).toBeTruthy()
  })

  test('className includes spread-index and slug', () => {
    const { container } = renderLayout({ spreadIndex: 3, slug: 'chapter-2' })

    const layout = container.querySelector('#layout')
    expect(layout.className).toContain('spread-index__3')
    expect(layout.className).toContain('chapter-2')
  })

  describe('getLayoutStyles', () => {
    test('normal (non-scroll) layout uses viewerSettings padding as-is', () => {
      jest.spyOn(Viewport, 'isVerticalScrollConfigured').mockReturnValue(false)

      const { container } = renderLayout({ layout: 'columns' })
      const layout = container.querySelector('#layout')

      expect(layout.style.paddingTop).toBe('20px')
      expect(layout.style.paddingBottom).toBe('20px')
      expect(layout.style.width).toBe('1000px')
      expect(layout.style.height).toBe('800px')
    })

    test('vertical-scroll-configured layout overrides paddingTop/Bottom from the mobile breakpoint', () => {
      jest.spyOn(Viewport, 'isVerticalScrollConfigured').mockReturnValue(true)

      const { container } = renderLayout({ layout: 'scroll' })
      const layout = container.querySelector('#layout')

      // From breakpoints.get(MEDIA_QUERY_MOBILE)
      expect(layout.style.paddingTop).toBe('55px')
      expect(layout.style.paddingBottom).toBe('80px')
    })
  })

  describe('Leaves', () => {
    test('renders left/right leaf divs for non-scrolling layout', () => {
      jest.spyOn(Viewport, 'isVerticallyScrolling').mockReturnValue(false)

      const { container } = renderLayout()

      expect(container.querySelector('.bber-leaf--left')).toBeTruthy()
      expect(container.querySelector('.bber-leaf--right')).toBeTruthy()
    })

    test('renders nothing for vertically-scrolling layout', () => {
      jest.spyOn(Viewport, 'isVerticallyScrolling').mockReturnValue(true)

      const { container } = renderLayout({ layout: 'scroll' })

      expect(container.querySelector('.bber-leaf--left')).toBeNull()
      expect(container.querySelector('.bber-leaf--right')).toBeNull()
    })

    test('firefox: left leaf uses negated translateX as `left` style', () => {
      jest.spyOn(Viewport, 'isVerticallyScrolling').mockReturnValue(false)
      browser.name = 'firefox'

      const { container } = renderLayout({}, {}, { getTranslateX: () => 50 })

      const left = container.querySelector('.bber-leaf--left')
      const right = container.querySelector('.bber-leaf--right')

      expect(left.style.left).toBe('-50px')
      expect(right.style.right).toBe('50px')

      browser.name = 'chrome'
    })

    test('non-firefox: leaves use a transform translateX style', () => {
      jest.spyOn(Viewport, 'isVerticallyScrolling').mockReturnValue(false)
      browser.name = 'chrome'

      const { container } = renderLayout({}, {}, { getTranslateX: () => 50 })

      const left = container.querySelector('.bber-leaf--left')
      const right = container.querySelector('.bber-leaf--right')

      expect(left.style.transform).toContain('translateX(-50px)')
      expect(right.style.transform).toContain('translateX(-50px)')
    })

    test('enableTransitions false sets transition: none on leaves', () => {
      jest.spyOn(Viewport, 'isVerticallyScrolling').mockReturnValue(false)

      const { container } = renderLayout(
        {},
        { userInterface: { enableTransitions: false } }
      )

      const left = container.querySelector('.bber-leaf--left')
      expect(left.style.transition).toBe('none')
    })
  })

  describe('resize handling', () => {
    beforeEach(() => {
      jest.useFakeTimers()
    })

    afterEach(() => {
      jest.useRealTimers()
    })

    test('window resize (after debounce) calls updateDimensions and recomputes transform', () => {
      const updateDimensions = jest.fn()
      // Return an increasing value so the post-resize transform is
      // distinguishable from the mount-time transform (both call
      // getTranslateX(undefined), so a stateful mock differentiates them).
      let translateX = 0
      const getTranslateX = jest.fn(() => translateX)

      const { container } = renderLayout(
        { updateDimensions },
        {},
        { getTranslateX }
      )

      // Mount effect already called updateDimensions once
      expect(updateDimensions).toHaveBeenCalledTimes(1)

      translateX = 123

      act(() => {
        window.dispatchEvent(new Event('resize'))
        jest.advanceTimersByTime(RESIZE_DEBOUNCE_TIMER)
      })

      expect(updateDimensions).toHaveBeenCalledTimes(2)

      const layout = container.querySelector('#layout')
      expect(layout.style.transform).toContain('translateX(123px)')
    })

    test('resize listener is removed on unmount', () => {
      const removeSpy = jest.spyOn(window, 'removeEventListener')
      const { unmount } = renderLayout()

      unmount()

      expect(removeSpy).toHaveBeenCalledWith('resize', expect.any(Function))
    })
  })

  describe('spreadIndex change effect', () => {
    test('changing spreadIndex recomputes the transform via getTranslateX', () => {
      const getTranslateX = jest.fn((idx) => (idx === 1 ? 999 : 0))

      const { container, rerender, store } = renderLayout(
        { spreadIndex: 0 },
        {},
        { getTranslateX }
      )

      rerender(
        <Provider store={store}>
          <ReaderContext.Provider
            value={{
              lastSpread: false,
              spreadIndex: 1,
              getTranslateX,
              navigateToChapterByURL: jest.fn(),
              getSpineItemByAbsoluteUrl: jest.fn(),
            }}
          >
            <Layout
              getFrameHeight={jest.fn(() => 760)}
              updateDimensions={jest.fn()}
              viewerSettings={baseViewerSettings}
              layout="columns"
              slug="chapter-1"
              spreadIndex={1}
              spineItemURL="chapter-1.xhtml"
              lastSpreadIndex={2}
              BookContent={BookContent}
              innerRef={{ current: null }}
            />
          </ReaderContext.Provider>
        </Provider>
      )

      const layout = container.querySelector('#layout')
      expect(layout.style.transform).toContain('translateX(999px)')
    })
  })
})
