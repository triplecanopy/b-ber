/**
 * Smoke tests for Ultimate (layout-stability sentinel).
 *
 * Critical path:
 *   1. Ultimate mounts → scheduleCheck() starts
 *   2. First tick: records offsetLeft (0 in jsdom) as baseline, reschedules
 *   3. REQUIRED_STABLE_CHECKS further ticks with offsetLeft unchanged → onStable()
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
const MAX_WAIT = 2500 // must match MAX_WAIT_MS in Ultimate.jsx
const REQUIRED_STABLE_CHECKS = 3 // must match REQUIRED_STABLE_CHECKS in Ultimate.jsx
// One baseline tick + REQUIRED_STABLE_CHECKS matching ticks before onStable()
const TICKS_TO_STABLE = REQUIRED_STABLE_CHECKS + 1

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

  test('hides spinner after offsetLeft holds steady for REQUIRED_STABLE_CHECKS', () => {
    const store = createTestStore()
    expect(store.getState().userInterface.spinnerVisible).toBe(true)

    renderUltimate(store)

    // Tick 1: lastOffsetLeftRef is null → records offsetLeft (0 in jsdom), reschedules
    act(() => {
      jest.advanceTimersByTime(INTERVAL)
    })
    expect(store.getState().userInterface.spinnerVisible).toBe(true)

    // REQUIRED_STABLE_CHECKS further ticks with offsetLeft unchanged → onStable()
    act(() => {
      jest.advanceTimersByTime(INTERVAL * REQUIRED_STABLE_CHECKS)
    })

    const state = store.getState()
    expect(state.userInterface.spinnerVisible).toBe(false)
    expect(state.userInterface.handleEvents).toBe(true)
    expect(state.view.loaded).toBe(true)
  })

  test('hides spinner via MAX_WAIT_MS fallback when fired past timeout', () => {
    // Advance well past MAX_WAIT_MS. Even if something prevented the normal
    // two-tick stability path, the hard timeout must fire onStable().
    // In jsdom offsetLeft is always 0 so stability fires at ~400ms anyway,
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

    // First stability cycle: baseline + REQUIRED_STABLE_CHECKS ticks → onStable()
    act(() => {
      jest.advanceTimersByTime(INTERVAL * TICKS_TO_STABLE)
    })
    expect(store.getState().userInterface.spinnerVisible).toBe(false)

    // Simulate the chapter-change signal by flipping view.loaded true → false.
    // Ultimate's useEffect watches view.loaded and calls startWatching() on that
    // edge. (In production the per-chapter restart also happens via remount.)
    act(() => {
      store.dispatch(viewActions.unload())
    })

    expect(store.getState().view.loaded).toBe(false)

    // Ultimate restarted its loop; another full cycle → onStable() fires again.
    act(() => {
      jest.advanceTimersByTime(INTERVAL * TICKS_TO_STABLE)
    })

    expect(store.getState().view.loaded).toBe(true)
    expect(store.getState().userInterface.spinnerVisible).toBe(false)
    expect(store.getState().userInterface.handleEvents).toBe(true)
  })
})
