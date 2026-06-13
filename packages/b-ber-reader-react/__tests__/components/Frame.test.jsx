/**
 * Tests for Frame.jsx — the scrollable viewport container that wraps Layout.
 *
 * Strategy: Layout is mocked as a placeholder so this is a test of Frame's
 * own rendering logic (className/style derivation, scroll-to-top effect),
 * not the full Layout tree.
 */

import { render } from '@testing-library/react'
import React from 'react'
import { Provider } from 'react-redux'
import Frame from '../../src/components/Frame'
import Asset from '../../src/helpers/Asset'
import Viewport from '../../src/helpers/Viewport'
import { createTestStore } from '../helpers/store'

jest.mock('../../src/components/Layout', () => {
  return function Layout() {
    return <div data-testid="layout" />
  }
})

function renderFrame(props = {}, overrides = {}) {
  const store = createTestStore(overrides)

  const defaultProps = {
    slug: 'chapter-1',
    layout: 'columns',
    spreadIndex: 0,
    spineItemURL: 'chapter-1.xhtml',
    view: { loaded: true },
    BookContent: () => null,
    ...props,
  }

  return render(
    <Provider store={store}>
      <Frame {...defaultProps} />
    </Provider>
  )
}

describe('Frame', () => {
  afterEach(() => {
    jest.restoreAllMocks()
  })

  test('className includes a hash of readerSettings.bookURL', () => {
    const bookURL = 'https://example.com/book-slug'
    const { container } = renderFrame({}, { readerSettings: { bookURL } })

    const frame = container.querySelector('#frame')
    expect(frame.className).toContain(`_${Asset.createHash(bookURL)}`)
  })

  test('appends custom className from props', () => {
    const { container } = renderFrame({ className: 'custom-class' })

    const frame = container.querySelector('#frame')
    expect(frame.className).toContain('custom-class')
  })

  test('renders Layout inside #frame', () => {
    const { getByTestId } = renderFrame()
    expect(getByTestId('layout')).toBeTruthy()
  })

  describe('style branches', () => {
    test('vertical-scroll layout applies overflowY/X styles', () => {
      jest.spyOn(Viewport, 'isVerticallyScrolling').mockReturnValue(true)

      const { container } = renderFrame({ layout: 'scroll' })
      const frame = container.querySelector('#frame')

      expect(frame.style.overflowY).toBe('auto')
      expect(frame.style.overflowX).toBe('hidden')
    })

    test('non-scrolling layout applies overflow: hidden', () => {
      jest.spyOn(Viewport, 'isVerticallyScrolling').mockReturnValue(false)

      const { container } = renderFrame({ layout: 'columns' })
      const frame = container.querySelector('#frame')

      expect(frame.style.overflow).toBe('hidden')
    })

    test('custom props.style is merged into the computed style', () => {
      const { container } = renderFrame({
        style: { backgroundColor: 'rebeccapurple' },
      })

      const frame = container.querySelector('#frame')
      expect(frame.style.backgroundColor).toBe('rebeccapurple')
    })

    test('non-plain-object props.style is ignored', () => {
      const { container } = renderFrame({ style: 'not-an-object' })

      const frame = container.querySelector('#frame')
      // Should not throw, and base styles still apply
      expect(frame.style.position).toBe('absolute')
    })
  })

  describe('scroll-to-top effect', () => {
    test('calls node.scrollTo(0, 0) when single column and slug changes', () => {
      jest.spyOn(Viewport, 'isSingleColumn').mockReturnValue(true)

      const scrollToSpy = jest.fn()
      // jsdom does not implement scrollTo on elements by default
      Element.prototype.scrollTo = scrollToSpy

      const { rerender } = render(
        <Provider store={createTestStore()}>
          <Frame
            slug="chapter-1"
            layout="columns"
            spreadIndex={0}
            spineItemURL="chapter-1.xhtml"
            view={{ loaded: true }}
            BookContent={() => null}
          />
        </Provider>
      )

      rerender(
        <Provider store={createTestStore()}>
          <Frame
            slug="chapter-2"
            layout="columns"
            spreadIndex={0}
            spineItemURL="chapter-2.xhtml"
            view={{ loaded: true }}
            BookContent={() => null}
          />
        </Provider>
      )

      expect(scrollToSpy).toHaveBeenCalledWith(0, 0)

      delete Element.prototype.scrollTo
    })

    test('does not call scrollTo when not single column', () => {
      jest.spyOn(Viewport, 'isSingleColumn').mockReturnValue(false)

      const scrollToSpy = jest.fn()
      Element.prototype.scrollTo = scrollToSpy

      const { rerender } = render(
        <Provider store={createTestStore()}>
          <Frame
            slug="chapter-1"
            layout="columns"
            spreadIndex={0}
            spineItemURL="chapter-1.xhtml"
            view={{ loaded: true }}
            BookContent={() => null}
          />
        </Provider>
      )

      rerender(
        <Provider store={createTestStore()}>
          <Frame
            slug="chapter-2"
            layout="columns"
            spreadIndex={0}
            spineItemURL="chapter-2.xhtml"
            view={{ loaded: true }}
            BookContent={() => null}
          />
        </Provider>
      )

      expect(scrollToSpy).not.toHaveBeenCalled()

      delete Element.prototype.scrollTo
    })
  })
})
