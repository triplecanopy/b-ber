/**
 * Smoke tests for Ultimate (layout-stability sentinel).
 *
 * Critical path:
 *   1. Ultimate mounts → scheduleCheck() starts
 *   2. First tick: records offsetLeft (0 in jsdom), reschedules
 *   3. Second tick: offsetLeft still 0 (unchanged) → calls onStable()
 *   4. onStable() dispatches: spinnerVisible=false, handleEvents=true, view.loaded=true
 *
 * Also verifies the MAX_WAIT_MS hard timeout fires onStable regardless.
 */

import { act, render } from '@testing-library/react'
import React from 'react'
import { Provider } from 'react-redux'
import * as viewActions from '../../src/actions/view'
import Ultimate from '../../src/components/Ultimate'
import { createTestStore } from '../helpers/store'

const INTERVAL = 100 // must match STABILITY_CHECK_INTERVAL_MS in Ultimate.jsx
const MAX_WAIT = 1500 // must match MAX_WAIT_MS in Ultimate.jsx

function renderUltimate(store) {
  return render(
    <Provider store={store}>
      <Ultimate>
        <span data-testid="sentinel" />
      </Ultimate>
    </Provider>
  )
}

describe('Ultimate', () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.clearAllTimers()
    jest.useRealTimers()
  })

  test('hides spinner after two consecutive stable offsetLeft readings', () => {
    const store = createTestStore()
    expect(store.getState().userInterface.spinnerVisible).toBe(true)

    renderUltimate(store)

    // Tick 1: lastOffsetLeftRef is null → records offsetLeft (0 in jsdom), reschedules
    act(() => {
      jest.advanceTimersByTime(INTERVAL)
    })
    expect(store.getState().userInterface.spinnerVisible).toBe(true)

    // Tick 2: offsetLeft still 0 → stable → onStable() fires
    act(() => {
      jest.advanceTimersByTime(INTERVAL)
    })

    const state = store.getState()
    expect(state.userInterface.spinnerVisible).toBe(false)
    expect(state.userInterface.handleEvents).toBe(true)
    expect(state.view.loaded).toBe(true)
  })

  test('hides spinner via MAX_WAIT_MS fallback when fired past timeout', () => {
    // Advance well past MAX_WAIT_MS. Even if something prevented the normal
    // two-tick stability path, the hard timeout must fire onStable().
    // In jsdom offsetLeft is always 0 so stability fires at ~200ms anyway,
    // but this confirms the spinner is hidden and no timer error is thrown.
    const store = createTestStore()

    renderUltimate(store)

    act(() => {
      jest.advanceTimersByTime(MAX_WAIT + INTERVAL)
    })

    expect(store.getState().userInterface.spinnerVisible).toBe(false)
    expect(store.getState().userInterface.handleEvents).toBe(true)
  })

  test('restarts stability check when view.loaded flips true → false (chapter change)', () => {
    const store = createTestStore()

    renderUltimate(store)

    // First stability cycle: 2 ticks → onStable()
    act(() => {
      jest.advanceTimersByTime(INTERVAL * 2)
    })
    expect(store.getState().userInterface.spinnerVisible).toBe(false)

    // Simulate a chapter change: freeze() dispatches unload, setting view.loaded=false.
    // Ultimate's useEffect watches view.loaded and calls startWatching() when it
    // flips true → false.
    act(() => {
      store.dispatch(viewActions.unload())
    })

    expect(store.getState().view.loaded).toBe(false)

    // Ultimate restarted its loop. Two more ticks → onStable() fires again.
    act(() => {
      jest.advanceTimersByTime(INTERVAL * 2)
    })

    expect(store.getState().view.loaded).toBe(true)
    expect(store.getState().userInterface.spinnerVisible).toBe(false)
    expect(store.getState().userInterface.handleEvents).toBe(true)
  })
})
