import { act, render } from '@testing-library/react'
import React from 'react'
import { Provider } from 'react-redux'
import Spread from '../../src/components/Spread'
import browserMock from '../../src/lib/browser'
import SpreadContext from '../../src/lib/spread-context'
import { StoreProvider } from '../../src/store/StoreContext'
import { createTestReaderStore } from '../helpers/renderWithStore'
import { createTestStore } from '../helpers/store'

// detect-browser returns null in jsdom; Spread.jsx reads browserMock.name, which
// crashes on a null browser object. Replace with a mutable stub so tests can
// flip the `name` to exercise the safari column-break branch.
jest.mock('../../src/lib/browser', () => ({ name: 'chrome' }))

// viewerSettings tuned so Viewport.getPageWidth = width - paddingLeft -
// paddingRight + columnGap is a finite, non-zero value.
const viewerSettings = {
  width: 1000,
  height: 800,
  paddingLeft: 50,
  paddingRight: 50,
  paddingTop: 20,
  paddingBottom: 20,
  columnGap: 100,
  columns: '2 auto',
}

const renderSpread = ({ storeOverrides = {}, props = {}, children } = {}) => {
  // Spread reads readerSettings from the built-in store and viewerSettings/view
  // from redux; seed both from the same overrides (TASK-106).
  const overrides = {
    viewerSettings,
    view: { loaded: true, ultimateOffsetLeft: 0, lastSpreadIndex: 0 },
    ...storeOverrides,
  }
  const store = createTestStore(overrides)

  const tree = render(
    <Provider store={store}>
      <StoreProvider store={createTestReaderStore(overrides)}>
        <Spread data-marker-reference="ref-1" className="custom" {...props}>
          {children || <div data-testid="spread-child">content</div>}
        </Spread>
      </StoreProvider>
    </Provider>
  )

  return { ...tree, store }
}

describe('Spread', () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    act(() => {
      jest.runOnlyPendingTimers()
    })
    jest.useRealTimers()
  })

  test('renders children inside a bber-spread container with data attribute and className', () => {
    const { container, getByTestId } = renderSpread()

    const spread = container.querySelector('.bber-spread')
    expect(spread).not.toBeNull()
    expect(spread.className).toMatch(/custom/)
    expect(spread.dataset.markerReference).toBe('ref-1')
    expect(getByTestId('spread-child')).toBeTruthy()
  })

  test('classifies as verso (2x height) by default (offsetLeft 0 in jsdom)', () => {
    const { container } = renderSpread()

    act(() => {
      jest.runOnlyPendingTimers()
    })

    const spread = container.querySelector('.bber-spread')

    // offset starts at 0 (integer) -> verso -> multiplier 2
    expect(spread.className).toMatch(/bber-spread-verso/)
    expect(spread.className).not.toMatch(/bber-spread-recto/)

    // height = (windowHeight - paddingTop - paddingBottom) * multiplier
    const expectedHeight = (viewerSettings.height - 20 - 20) * 2
    expect(spread.style.height).toBe(`${expectedHeight}px`)
  })

  test('provides a SpreadContext value with left=0 for the first (verso) spread', () => {
    let contextValue

    renderSpread({
      children: (
        <SpreadContext.Consumer>
          {(value) => {
            contextValue = value
            return <div data-testid="consumer" />
          }}
        </SpreadContext.Consumer>
      ),
    })

    act(() => {
      jest.runOnlyPendingTimers()
    })

    // verso -> nextLeft = Math.round(offset) * pageWidth = 0 * 1000 (may be -0)
    expect(
      Object.is(contextValue.left, 0) || Object.is(contextValue.left, -0)
    ).toBe(true)
    expect(contextValue.layout).toBeUndefined()
  })

  test('recto classification (3x height) when offsetLeft yields a half-integer offset', () => {
    // Mock offsetLeft on HTMLElement.prototype so node.current.offsetLeft
    // returns a value that maps to offset=0.5 (recto).
    // rawOffset = (nextLeft - paddingLeft) / pageWidth
    // pageWidth = width - paddingLeft - paddingRight + columnGap = 1000-50-50+100=1000
    // To get offset=0.5: nextLeft = paddingLeft + 0.5*pageWidth = 50 + 500 = 550
    const offsetLeftSpy = jest
      .spyOn(window.HTMLElement.prototype, 'offsetLeft', 'get')
      .mockReturnValue(550)

    const { container } = renderSpread()

    act(() => {
      jest.runOnlyPendingTimers()
    })

    const spread = container.querySelector('.bber-spread')
    expect(spread.className).toMatch(/bber-spread-recto/)

    const expectedHeight = (viewerSettings.height - 20 - 20) * 3
    expect(spread.style.height).toBe(`${expectedHeight}px`)

    offsetLeftSpy.mockRestore()
  })

  test('SpreadContext left for recto spread is computed from pageWidth', () => {
    const offsetLeftSpy = jest
      .spyOn(window.HTMLElement.prototype, 'offsetLeft', 'get')
      .mockReturnValue(550)

    let contextValue

    renderSpread({
      children: (
        <SpreadContext.Consumer>
          {(value) => {
            contextValue = value
            return <div data-testid="consumer" />
          }}
        </SpreadContext.Consumer>
      ),
    })

    act(() => {
      jest.runOnlyPendingTimers()
    })

    // recto -> nextLeft = (Math.floor(offset) + 1) * pageWidth = (0 + 1) * 1000
    expect(contextValue.left).toBe(1000)

    offsetLeftSpy.mockRestore()
  })

  test('SpreadContext left is 0 when vertically scrolling', () => {
    let contextValue

    renderSpread({
      storeOverrides: { readerSettings: { layout: 'scroll' } },
      children: (
        <SpreadContext.Consumer>
          {(value) => {
            contextValue = value
            return <div data-testid="consumer" />
          }}
        </SpreadContext.Consumer>
      ),
    })

    act(() => {
      jest.runOnlyPendingTimers()
    })

    expect(contextValue.left).toBe(0)
  })

  test('applies safari column-break styles when browser is safari', () => {
    const originalName = browserMock.name
    browserMock.name = 'safari'

    const { container } = renderSpread()

    act(() => {
      jest.runOnlyPendingTimers()
    })

    const spread = container.querySelector('.bber-spread')
    expect(spread.style.WebkitColumnBreakBefore).toBe('always')
    expect(spread.style.WebkitColumnBreakAfter).toBe('always')
    expect(spread.style.WebkitColumnBreakInside).toBe('avoid')

    browserMock.name = originalName
  })

  test('does not apply safari column-break styles on other browsers', () => {
    const originalName = browserMock.name
    browserMock.name = 'chrome'

    const { container } = renderSpread()

    act(() => {
      jest.runOnlyPendingTimers()
    })

    const spread = container.querySelector('.bber-spread')
    expect(spread.style.WebkitColumnBreakBefore).toBeFalsy()

    browserMock.name = originalName
  })

  test('readOffset bails when pageWidth is not finite (vertical scroll layout, width=auto)', () => {
    const scrollViewerSettings = { ...viewerSettings, width: 'auto' }

    const overrides = {
      viewerSettings: scrollViewerSettings,
      view: { loaded: true, ultimateOffsetLeft: 0, lastSpreadIndex: 0 },
      readerSettings: { layout: 'scroll' },
    }

    const { container } = render(
      <Provider store={createTestStore(overrides)}>
        <StoreProvider store={createTestReaderStore(overrides)}>
          <Spread data-marker-reference="ref-1" className="custom">
            <div data-testid="spread-child">content</div>
          </Spread>
        </StoreProvider>
      </Provider>
    )

    act(() => {
      jest.runOnlyPendingTimers()
    })

    // offset never changes from its initial value (0) -> verso, multiplier 2
    const spread = container.querySelector('.bber-spread')
    expect(spread.className).toMatch(/bber-spread-verso/)
  })

  test('ResizeObserver triggers re-stabilization on resize', () => {
    let observerInstance

    const OriginalResizeObserver = global.ResizeObserver
    global.ResizeObserver = class extends OriginalResizeObserver {
      constructor(cb) {
        super(cb)
        observerInstance = this
      }
    }

    const { container, unmount } = renderSpread()

    act(() => {
      jest.runOnlyPendingTimers()
    })

    expect(observerInstance).toBeDefined()

    act(() => {
      observerInstance.trigger([
        { target: container.querySelector('.bber-spread') },
      ])
      jest.runOnlyPendingTimers()
    })

    const spread = container.querySelector('.bber-spread')
    expect(spread).not.toBeNull()

    unmount()
    global.ResizeObserver = OriginalResizeObserver
  })

  test('cleans up resize observer and animation frame on unmount', () => {
    const { unmount } = renderSpread()

    act(() => {
      jest.runOnlyPendingTimers()
    })

    expect(() => unmount()).not.toThrow()
  })
})
