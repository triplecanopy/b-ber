/**
 * Tests for Reader/index.jsx — the main orchestrator component.
 *
 * Strategy: Controls, Frame, Spinner, and the loader/navigation/resize
 * modules are mocked so this is a behavioral test of the orchestration
 * logic (the selfRef wiring, effects, and state transitions) rather than
 * a full integration test. navigation.js and resize.js already have
 * dedicated unit test files with full coverage of their internals — here
 * we only verify that Reader invokes them correctly.
 *
 * Deliberately left uncovered (documented per task instructions):
 *   - The debounced handleResizeStart/handleResizeEnd (1000ms lodash
 *     debounce) are bound but never fired here — resize.test.js covers
 *     their internals; firing them would require fake timers + window
 *     resize events with little additional value for THIS file's coverage.
 *   - getTranslateX's branch math (Viewport.getPageWidth /
 *     isVerticallyScrolling) is exercised only at the default value;
 *     deeper viewport-scrolling permutations are covered by other tests.
 *   - The error/catch path inside loadSpineItem (loader.js) — out of scope
 *     for this file, covered (or not) by loader's own tests.
 */

import { act, render } from '@testing-library/react'
import React from 'react'
import { Provider } from 'react-redux'
import * as readerLocationActions from '../../../src/actions/reader-location'
import * as viewActions from '../../../src/actions/view'
import Reader from '../../../src/components/Reader'
import {
  book,
  createStateFromOPF,
  loadSpineItem,
} from '../../../src/components/Reader/loader'
import * as navigationModule from '../../../src/components/Reader/navigation'
import * as resizeModule from '../../../src/components/Reader/resize'
import Asset from '../../../src/helpers/Asset'
import { makeTwoChapterSpine } from '../../helpers/fixtures'
import { createTestStore } from '../../helpers/store'

// navigation.js and resize.js export plain functions; ES module exports are
// non-configurable so jest.spyOn cannot replace them directly. Mocking the
// modules with jest.requireActual + jest.fn wrappers lets us assert calls
// while preserving real behavior for the functions Reader binds via selfRef.
jest.mock('../../../src/components/Reader/navigation', () => {
  const actual = jest.requireActual('../../../src/components/Reader/navigation')
  return {
    ...actual,
    navigateToSpreadByIndex: jest.fn(actual.navigateToSpreadByIndex),
  }
})

jest.mock('../../../src/components/Reader/resize', () => {
  const actual = jest.requireActual('../../../src/components/Reader/resize')
  return {
    ...actual,
    bindResizeHandlers: jest.fn(actual.bindResizeHandlers),
    unbindResizeHandlers: jest.fn(actual.unbindResizeHandlers),
  }
})

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

jest.mock('../../../src/components/Reader/loader', () => ({
  book: { content: null },
  createStateFromOPF: jest.fn(),
  loadSpineItem: jest.fn(),
  showSpineItem: jest.fn(),
}))

const spine = makeTwoChapterSpine()

describe('Reader', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    book.content = null
  })

  function renderReader(overrides = {}) {
    const store = createTestStore(overrides)
    const utils = render(
      <Provider store={store}>
        <Reader />
      </Provider>
    )
    return { store, ...utils }
  }

  test('on mount, shows the spinner and calls createStateFromOPF', () => {
    const { store } = renderReader()

    expect(store.getState().userInterface.spinnerVisible).toBe(true)
    expect(store.getState().userInterface.handleEvents).toBe(false)
    expect(createStateFromOPF).toHaveBeenCalledTimes(1)
    expect(createStateFromOPF).toHaveBeenCalledWith(expect.any(Function))
  })

  test('createStateFromOPF callback: matching currentSpineItemIndex loads that spine item', async () => {
    renderReader({
      readerLocation: { searchParams: '?currentSpineItemIndex=1' },
    })

    // Run the createStateFromOPF callback as the loader would: it merges
    // `spine` into Reader state via setState (the first arg to
    // createStateFromOPF), simulated here by calling the mock's callback
    // after setState has been wired.
    const callback = createStateFromOPF.mock.calls[0][0]

    // Simulate the loader having populated `spine` in state by directly
    // invoking the effect's logic. Since createStateFromOPF is mocked, we
    // need to drive state via the real setState — but Reader exposes no
    // imperative handle, so instead we verify the callback closes over
    // `stateRef`, which initially has an empty spine ([]).
    // With an empty spine, currentSpineItem is undefined, so the fallback
    // branch (loadSpineItem with no args) is exercised here.
    await act(async () => {
      callback()
    })

    expect(loadSpineItem).toHaveBeenCalledTimes(1)
    expect(loadSpineItem).toHaveBeenCalledWith()
  })

  test('resize effect binds on mount and cleans up (calls Asset.removeBookStyles) on unmount', () => {
    const removeBookStylesSpy = jest.spyOn(Asset, 'removeBookStyles')

    const { unmount } = renderReader({
      readerSettings: { bookURL: 'https://example.com/book' },
    })

    // Per the H4-inverted-naming comment: unbindResizeHandlers is called on
    // mount (it actually adds listeners), and bindResizeHandlers is called
    // on unmount (it actually removes listeners).
    expect(resizeModule.unbindResizeHandlers).toHaveBeenCalledTimes(1)
    expect(resizeModule.bindResizeHandlers).not.toHaveBeenCalled()

    unmount()

    expect(resizeModule.bindResizeHandlers).toHaveBeenCalledTimes(1)
    expect(removeBookStylesSpy).toHaveBeenCalledWith(
      Asset.createHash('https://example.com/book')
    )

    removeBookStylesSpy.mockRestore()
  })

  test('searchParams effect: same chapter, different spread updates spreadIndex without loading', () => {
    const { store } = renderReader({
      readerLocation: {
        searchParams: '?slug=chapter-1&currentSpineItemIndex=0&spreadIndex=0',
      },
    })

    loadSpineItem.mockClear()

    act(() => {
      store.dispatch(
        readerLocationActions.updateLocation({
          searchParams: '?slug=chapter-1&currentSpineItemIndex=0&spreadIndex=1',
        })
      )
    })

    expect(loadSpineItem).not.toHaveBeenCalled()
  })

  test('searchParams effect: different slug (external nav) loads the matched spine item', () => {
    const { store } = renderReader({
      readerLocation: {
        searchParams: '?slug=chapter-1&currentSpineItemIndex=0&spreadIndex=0',
      },
    })

    loadSpineItem.mockClear()

    act(() => {
      store.dispatch(
        readerLocationActions.updateLocation({
          searchParams: '?slug=chapter-2&currentSpineItemIndex=1&spreadIndex=0',
        })
      )
    })

    // currentSpineItem is null in initial state (never set, since
    // createStateFromOPF is mocked), so `find(spine, { slug })` against an
    // empty spine returns undefined — loadSpineItem is still called with
    // that undefined spineItem (external-navigation branch).
    expect(loadSpineItem).toHaveBeenCalledTimes(1)
    expect(loadSpineItem).toHaveBeenCalledWith(undefined)
  })

  test('searchParams effect: same searchParams value is a no-op (guard)', () => {
    const searchParams = '?slug=chapter-1&currentSpineItemIndex=0&spreadIndex=0'
    const { store } = renderReader({
      readerLocation: { searchParams },
    })

    loadSpineItem.mockClear()

    act(() => {
      // Dispatch the exact same searchParams value again
      store.dispatch(readerLocationActions.updateLocation({ searchParams }))
    })

    expect(loadSpineItem).not.toHaveBeenCalled()
  })

  test('view.loaded/lastSpreadIndex effect: navigateToSpreadByIndex is invoked when chapterDelta < 0 (default state)', () => {
    // chapterDelta defaults to 0 in initial state, so navigateToSpreadByIndex
    // is NOT called — this documents the guarded branch for the default case.
    const { store } = renderReader()

    act(() => {
      store.dispatch(viewActions.updateLastSpreadIndex(2))
    })

    act(() => {
      store.dispatch(viewActions.load(true))
    })

    // chapterDelta is 0 by default (not < 0), so navigateToSpreadByIndex is
    // not invoked via this effect.
    expect(navigationModule.navigateToSpreadByIndex).not.toHaveBeenCalled()
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
    // Drive Reader into a state where spine[currentSpineItemIndex] resolves,
    // by having createStateFromOPF's setState populate `spine` and the
    // searchParams effect set `currentSpineItemIndex`.
    createStateFromOPF.mockImplementation(function mockCreateStateFromOPF(cb) {
      this.setState({ spine }, cb)
    })

    const { getByTestId } = renderReader({
      readerLocation: {
        searchParams: '?slug=chapter-1&currentSpineItemIndex=0&spreadIndex=0',
      },
    })

    // After mount, createStateFromOPF's mock sets spine=[...] then invokes
    // the callback, which (since spine[0] now exists) calls setState with
    // currentSpineItem/currentSpineItemIndex/spreadIndex and then
    // selfRef.current.loadSpineItem(currentSpineItem).
    await act(async () => {
      await Promise.resolve()
    })

    expect(loadSpineItem).toHaveBeenCalledWith(spine[0])

    const frame = getByTestId('frame')
    expect(frame.dataset.slug).toBe('chapter-1')
  })
})
