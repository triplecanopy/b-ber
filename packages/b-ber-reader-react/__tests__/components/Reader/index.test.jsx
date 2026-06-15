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
import * as viewActions from '../../../src/actions/view'
import Reader from '../../../src/components/Reader'
import { book } from '../../../src/components/Reader/loader'
import Asset from '../../../src/helpers/Asset'
import { makeTwoChapterSpine } from '../../helpers/fixtures'
import { renderWithStores } from '../../helpers/renderWithStore'

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
  bindResizeHandlers: jest.fn(),
  unbindResizeHandlers: jest.fn(),
}

jest.mock('../../../src/components/Reader/loader', () => ({
  __esModule: true,
  book: { content: null },
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
        data-spine-item-url={props.spineItemURL}
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

const spine = makeTwoChapterSpine()

describe('Reader', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockLoaderFns.createStateFromOPF.mockReset()
    book.content = null
  })

  function renderReader(overrides = {}) {
    // readerSettings is read from the built-in store; view/userInterface/
    // readerLocation are still redux. `store` aliases the redux store for the
    // existing getState/dispatch assertions (TASK-106).
    const utils = renderWithStores(<Reader />, { overrides })
    return { store: utils.reduxStore, ...utils }
  }

  test('on mount, shows the spinner and calls createStateFromOPF', () => {
    const { readerStore } = renderReader()

    // userInterface now lives in the built-in store (TASK-106)
    expect(readerStore.getSnapshot().userInterface.spinnerVisible).toBe(true)
    expect(readerStore.getSnapshot().userInterface.handleEvents).toBe(false)
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

  test('resize effect binds on mount and cleans up (calls Asset.removeBookStyles) on unmount', () => {
    const removeBookStylesSpy = jest.spyOn(Asset, 'removeBookStyles')

    const { unmount } = renderReader({
      readerSettings: { bookURL: 'https://example.com/book' },
    })

    // Per the H4-inverted-naming comment: unbindResizeHandlers is called on
    // mount (it actually adds listeners), and bindResizeHandlers is called
    // on unmount (it actually removes listeners).
    expect(mockResizeFns.unbindResizeHandlers).toHaveBeenCalledTimes(1)
    expect(mockResizeFns.bindResizeHandlers).not.toHaveBeenCalled()

    unmount()

    expect(mockResizeFns.bindResizeHandlers).toHaveBeenCalledTimes(1)
    expect(removeBookStylesSpy).toHaveBeenCalledWith(
      Asset.createHash('https://example.com/book')
    )

    removeBookStylesSpy.mockRestore()
  })

  test('searchParams effect: same chapter, different spread updates spreadIndex without loading', () => {
    const { readerStore } = renderReader({
      readerLocation: {
        searchParams: '?slug=chapter-1&currentSpineItemIndex=0&spreadIndex=0',
      },
    })

    mockLoaderFns.loadSpineItem.mockClear()

    act(() => {
      // readerLocation now lives in the built-in store (TASK-106)
      readerStore.setState({
        readerLocation: {
          searchParams: '?slug=chapter-1&currentSpineItemIndex=0&spreadIndex=1',
        },
      })
    })

    expect(mockLoaderFns.loadSpineItem).not.toHaveBeenCalled()
  })

  test('searchParams effect: different slug (external nav) loads the matched spine item', () => {
    const { readerStore } = renderReader({
      readerLocation: {
        searchParams: '?slug=chapter-1&currentSpineItemIndex=0&spreadIndex=0',
      },
    })

    mockLoaderFns.loadSpineItem.mockClear()

    act(() => {
      readerStore.setState({
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
    const { readerStore } = renderReader({
      readerLocation: { searchParams },
    })

    mockLoaderFns.loadSpineItem.mockClear()

    act(() => {
      // Set the exact same searchParams value again
      readerStore.setState({ readerLocation: { searchParams } })
    })

    expect(mockLoaderFns.loadSpineItem).not.toHaveBeenCalled()
  })

  test('view.loaded/lastSpreadIndex effect: navigateToSpreadByIndex is not invoked when chapterDelta is 0 (default state)', () => {
    const { store } = renderReader()

    act(() => {
      store.dispatch(viewActions.updateLastSpreadIndex(2))
    })

    act(() => {
      store.dispatch(viewActions.load(true))
    })

    // chapterDelta is 0 by default (not < 0), so navigateToSpreadByIndex is
    // not invoked via this effect.
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
    expect(frame.dataset.spineItemUrl).toBe('')

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
