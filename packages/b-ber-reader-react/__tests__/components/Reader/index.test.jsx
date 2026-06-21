/**
 * Tests for Reader/index.jsx — the main orchestrator component.
 *
 * Strategy: Controls, Frame, Spinner, and the useLoader/useNavigation/useResize
 * hooks are mocked so this is a behavioral test of the orchestration logic (the
 * effects, API assembly, and state transitions) rather than a full integration
 * test. navigation.js and resize.js have dedicated unit test files with full
 * coverage of their internals — here we only verify that Reader invokes them
 * correctly. The loader hook mock captures the deps Reader threads into it
 * (notably `setState`) so tests can drive Reader's internal state.
 *
 * Deliberately left uncovered (documented per task instructions):
 *   - The debounced handleResizeStart/handleResizeEnd are owned by useResize
 *     (resize.test.js covers them); firing them here adds little value.
 *   - getTranslateX's branch math is exercised only at the default value.
 *   - The error/catch path inside loadSpineItem (loader.js) — covered by
 *     loader's own tests.
 */

import { act } from '@testing-library/react'
import React from 'react'
import Reader from '../../../src/components/Reader'
import * as Asset from '../../../src/helpers/Asset'
import { makeTwoChapterSpine } from '../../helpers/fixtures'
import { renderWithStore } from '../../helpers/renderWithStore'

// The orchestrator logic now lives in three hooks. Mock each to return stable
// jest.fn stand-ins the tests can assert on. useLoader additionally records the
// deps Reader passes it (refs + setState) so the getSlug test can populate
// Reader's spine state the way the real createStateFromOPF would.
const mockLoaderFns = {
  createStateFromOPF: jest.fn(),
  loadSpineItem: jest.fn(),
  showSpineItem: jest.fn(),
}
const mockNavFns = {
  handlePageNavigation: jest.fn(),
  handleChapterNavigation: jest.fn(),
  navigateToChapterByURL: jest.fn(),
  getSpineItemByAbsoluteUrl: jest.fn(),
  navigateToSpreadByIndex: jest.fn(),
  navigateToElementById: jest.fn(),
  updateQueryString: jest.fn(),
  savePosition: jest.fn(),
}
const mockResizeFns = {
  handleResize: jest.fn(),
  handleResizeStart: jest.fn(),
  handleResizeEnd: jest.fn(),
  removeResizeHandlers: jest.fn(),
  addResizeHandlers: jest.fn(),
}

jest.mock('../../../src/components/Reader/loader', () => ({
  __esModule: true,
  useLoader: (deps) => {
    mockLoaderFns.deps = deps
    return mockLoaderFns
  },
}))

jest.mock('../../../src/components/Reader/navigation', () => ({
  __esModule: true,
  useNavigation: () => mockNavFns,
}))

jest.mock('../../../src/components/Reader/resize', () => ({
  __esModule: true,
  useResize: () => mockResizeFns,
}))

jest.mock('../../../src/components/Controls', () => {
  return function Controls(props) {
    return (
      <div
        data-testid="controls"
        data-props={JSON.stringify(Object.keys(props))}
      >
        {props.children}
      </div>
    )
  }
})

jest.mock('../../../src/components/Frame', () => {
  return function Frame(props) {
    return (
      <div
        data-testid="frame"
        data-slug={props.slug}
        data-spread-index={props.spreadIndex}
        data-loaded={String(props.view?.loaded)}
      />
    )
  }
})

jest.mock('../../../src/components/Spinner', () => {
  return function Spinner() {
    return <div data-testid="spinner" />
  }
})

// Asset is a module of named exports (TASK-103). Partial-mock it: keep the real
// createHash but make removeBookStyles a jest.fn so the unmount-cleanup test can
// assert on it (ES-module namespace bindings can't be jest.spyOn'd).
jest.mock('../../../src/helpers/Asset', () => ({
  __esModule: true,
  ...jest.requireActual('../../../src/helpers/Asset'),
  removeBookStyles: jest.fn(),
}))

const spine = makeTwoChapterSpine()

describe('Reader', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockLoaderFns.createStateFromOPF.mockReset()
  })

  function renderReader(overrides = {}) {
    // Every slice lives in the built-in store now (TASK-106); drive it via
    // `store.setState(...)` and read it via `store.getSnapshot()`.
    return renderWithStore(<Reader />, { overrides })
  }

  test('on mount, shows the spinner and calls createStateFromOPF', () => {
    const { store } = renderReader()

    // userInterface now lives in the built-in store (TASK-106)
    expect(store.getSnapshot().userInterface.spinnerVisible).toBe(true)
    expect(store.getSnapshot().userInterface.handleEvents).toBe(false)
    expect(mockLoaderFns.createStateFromOPF).toHaveBeenCalledTimes(1)
    expect(mockLoaderFns.createStateFromOPF).toHaveBeenCalledWith(
      expect.any(Function)
    )
  })

  test('createStateFromOPF callback: empty spine falls back to loadSpineItem with no args', async () => {
    renderReader({
      readerLocation: { searchParams: '?currentSpineItemIndex=1' },
    })

    // Run the createStateFromOPF callback as the loader would. Since the mock
    // doesn't populate spine, stateRef still has an empty spine ([]), so
    // currentSpineItem is undefined and the fallback branch (loadSpineItem with
    // no args) is exercised.
    const callback = mockLoaderFns.createStateFromOPF.mock.calls[0][0]

    await act(async () => {
      callback()
    })

    expect(mockLoaderFns.loadSpineItem).toHaveBeenCalledTimes(1)
    expect(mockLoaderFns.loadSpineItem).toHaveBeenCalledWith()
  })

  test('resize effect adds handlers on mount and cleans up (calls Asset.removeBookStyles) on unmount', () => {
    const { unmount } = renderReader({
      readerSettings: { bookURL: 'https://example.com/book' },
    })

    // addResizeHandlers is called on mount; removeResizeHandlers on unmount
    // (names now match what each function does — see resize.ts).
    expect(mockResizeFns.addResizeHandlers).toHaveBeenCalledTimes(1)
    expect(mockResizeFns.removeResizeHandlers).not.toHaveBeenCalled()

    unmount()

    expect(mockResizeFns.removeResizeHandlers).toHaveBeenCalledTimes(1)
    expect(Asset.removeBookStyles).toHaveBeenCalledWith(
      Asset.createHash('https://example.com/book')
    )
  })

  test('searchParams effect: same chapter, different spread updates spreadIndex without loading', () => {
    const { store } = renderReader({
      readerLocation: {
        searchParams: '?slug=chapter-1&currentSpineItemIndex=0&spreadIndex=0',
      },
    })

    mockLoaderFns.loadSpineItem.mockClear()

    act(() => {
      // readerLocation now lives in the built-in store (TASK-106)
      store.setState({
        readerLocation: {
          searchParams: '?slug=chapter-1&currentSpineItemIndex=0&spreadIndex=1',
        },
      })
    })

    expect(mockLoaderFns.loadSpineItem).not.toHaveBeenCalled()
  })

  test('searchParams effect: different slug (external nav) loads the matched spine item', () => {
    const { store } = renderReader({
      readerLocation: {
        searchParams: '?slug=chapter-1&currentSpineItemIndex=0&spreadIndex=0',
      },
    })

    mockLoaderFns.loadSpineItem.mockClear()

    act(() => {
      store.setState({
        readerLocation: {
          searchParams: '?slug=chapter-2&currentSpineItemIndex=1&spreadIndex=0',
        },
      })
    })

    // currentSpineItem is null in initial state (createStateFromOPF is mocked),
    // so `find(spine, { slug })` against an empty spine returns undefined —
    // loadSpineItem is still called with that undefined spineItem.
    expect(mockLoaderFns.loadSpineItem).toHaveBeenCalledTimes(1)
    expect(mockLoaderFns.loadSpineItem).toHaveBeenCalledWith(undefined)
  })

  test('searchParams effect: same searchParams value is a no-op (guard)', () => {
    const searchParams = '?slug=chapter-1&currentSpineItemIndex=0&spreadIndex=0'
    const { store } = renderReader({
      readerLocation: { searchParams },
    })

    mockLoaderFns.loadSpineItem.mockClear()

    act(() => {
      // Set the exact same searchParams value again
      store.setState({ readerLocation: { searchParams } })
    })

    expect(mockLoaderFns.loadSpineItem).not.toHaveBeenCalled()
  })

  test('view.loaded/lastSpreadIndex effect: navigateToSpreadByIndex is not invoked when chapterDelta is 0 (default state)', () => {
    const { store } = renderReader()

    // view now lives in the built-in store (TASK-106); drive it to fire the
    // settle effect.
    act(() => {
      store.setState((s) => ({
        view: { ...s.view, lastSpreadIndex: 2, loaded: true },
      }))
    })

    // chapterDelta is 0 by default (not < 0), so navigateToSpreadByIndex is
    // not invoked via this effect.
    expect(mockNavFns.navigateToSpreadByIndex).not.toHaveBeenCalled()
  })

  // TASK-107: on a deep link / refresh the chapter loads at spread 0; once it
  // has measured, the reader must restore the spread the URL asked for.
  test('initial-spread restore: navigates to the URL spreadIndex once the chapter settles', async () => {
    // createStateFromOPF populates spine and runs the init callback, which reads
    // spreadIndex=2 from the URL and stashes it for the restore effect.
    mockLoaderFns.createStateFromOPF.mockImplementation((cb) => {
      mockLoaderFns.deps.setState({ spine }, cb)
    })

    const { store } = renderReader({
      readerLocation: {
        searchParams: '?slug=chapter-1&currentSpineItemIndex=0&spreadIndex=2',
      },
    })

    await act(async () => {
      await Promise.resolve()
    })

    // Chapter measured (loaded + a real lastSpreadIndex wider than the target).
    act(() => {
      store.setState((s) => ({
        view: { ...s.view, lastSpreadIndex: 5, loaded: true },
      }))
    })

    expect(mockNavFns.navigateToSpreadByIndex).toHaveBeenCalledTimes(1)
    expect(mockNavFns.navigateToSpreadByIndex).toHaveBeenCalledWith(2)
  })

  test('initial-spread restore: clamps the URL spreadIndex to the measured lastSpreadIndex', async () => {
    mockLoaderFns.createStateFromOPF.mockImplementation((cb) => {
      mockLoaderFns.deps.setState({ spine }, cb)
    })

    const { store } = renderReader({
      readerLocation: {
        searchParams: '?slug=chapter-1&currentSpineItemIndex=0&spreadIndex=9',
      },
    })

    await act(async () => {
      await Promise.resolve()
    })

    // The chapter reflowed to fewer spreads than the URL recorded.
    act(() => {
      store.setState((s) => ({
        view: { ...s.view, lastSpreadIndex: 3, loaded: true },
      }))
    })

    expect(mockNavFns.navigateToSpreadByIndex).toHaveBeenCalledWith(3)
  })

  test('initial-spread restore: does nothing when the URL spreadIndex is 0', async () => {
    mockLoaderFns.createStateFromOPF.mockImplementation((cb) => {
      mockLoaderFns.deps.setState({ spine }, cb)
    })

    const { store } = renderReader({
      readerLocation: {
        searchParams: '?slug=chapter-1&currentSpineItemIndex=0&spreadIndex=0',
      },
    })

    await act(async () => {
      await Promise.resolve()
    })

    act(() => {
      store.setState((s) => ({
        view: { ...s.view, lastSpreadIndex: 5, loaded: true },
      }))
    })

    expect(mockNavFns.navigateToSpreadByIndex).not.toHaveBeenCalled()
  })

  test('renders Controls > ReaderContext.Provider > Frame + Spinner with expected props', () => {
    const { getByTestId } = renderReader()

    const controls = getByTestId('controls')
    const frame = getByTestId('frame')
    const spinner = getByTestId('spinner')

    expect(controls).toBeTruthy()
    expect(spinner).toBeTruthy()

    // getSlug() returns '' because spine is empty / currentSpineItemIndex
    // does not resolve to a spine entry in the initial state.
    expect(frame.dataset.slug).toBe('')
    expect(frame.dataset.spreadIndex).toBe('0')

    const controlsProps = JSON.parse(controls.dataset.props)
    expect(controlsProps).toEqual(
      expect.arrayContaining([
        'guide',
        'spine',
        'currentSpineItemIndex',
        'metadata',
        'showSidebar',
        'spreadIndex',
        'lastSpreadIndex',
        'handlePageNavigation',
        'destroyReaderComponent',
        'handleChapterNavigation',
        'handleSidebarButtonClick',
        'navigateToChapterByURL',
        'downloads',
        'uiOptions',
        'layout',
        'children',
      ])
    )
  })

  test('getSlug() returns the spine item slug once spine and currentSpineItemIndex resolve', async () => {
    // Drive Reader into a state where spine[currentSpineItemIndex] resolves, by
    // having createStateFromOPF's mock populate `spine` via the setState Reader
    // threaded into useLoader, then invoke the init callback.
    mockLoaderFns.createStateFromOPF.mockImplementation((cb) => {
      mockLoaderFns.deps.setState({ spine }, cb)
    })

    const { getByTestId } = renderReader({
      readerLocation: {
        searchParams: '?slug=chapter-1&currentSpineItemIndex=0&spreadIndex=0',
      },
    })

    await act(async () => {
      await Promise.resolve()
    })

    expect(mockLoaderFns.loadSpineItem).toHaveBeenCalledWith(spine[0])

    const frame = getByTestId('frame')
    expect(frame.dataset.slug).toBe('chapter-1')
  })
})
