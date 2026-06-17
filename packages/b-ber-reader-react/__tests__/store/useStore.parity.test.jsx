import { act } from '@testing-library/react'
import React from 'react'
import { useStore } from '../../src/store/StoreContext'
import { renderWithStore } from '../helpers/renderWithStore'

// Render-count parity check for the hot slices (TASK-106 / STATE-MIGRATION-PLAN
// "Re-render assessment"). connect()/react-redux re-renders a subscriber only
// when its selected slice actually changes (selector-level bailout). useStore
// (useSyncExternalStoreWithSelector + Object.is on the selected slice object)
// must preserve that: a view subscriber re-renders on a view write and NOT on
// an unrelated slice write.

function makeProbe(selector) {
  const renders = { count: 0 }
  function Probe() {
    renders.count += 1
    useStore(selector)
    return null
  }
  return { Probe, renders }
}

describe('useStore re-render parity (hot slices)', () => {
  test('view subscriber re-renders only when view changes, not on other slices', () => {
    const { Probe, renders } = makeProbe((s) => s.view)
    const { store } = renderWithStore(<Probe />)

    const initial = renders.count
    expect(initial).toBeGreaterThan(0)

    // An unrelated slice write must NOT re-render the view subscriber.
    act(() => {
      store.setState((s) => ({
        userInterface: { ...s.userInterface, spinnerVisible: false },
      }))
    })
    expect(renders.count).toBe(initial)

    // A view write re-renders it exactly once.
    act(() => {
      store.setState((s) => ({ view: { ...s.view, loaded: true } }))
    })
    expect(renders.count).toBe(initial + 1)

    // A no-op-shaped but new view object still counts as a change (matches the
    // whole-slice connect selector); writing the *same* primitive via a fresh
    // object is one render, and a second identical write is another (parity with
    // connect, which also re-renders when mapStateToProps returns a new ref).
    act(() => {
      store.setState((s) => ({ view: { ...s.view, lastSpreadIndex: 4 } }))
    })
    expect(renders.count).toBe(initial + 2)
  })

  test('viewerSettings subscriber is isolated from view writes', () => {
    const { Probe, renders } = makeProbe((s) => s.viewerSettings)
    const { store } = renderWithStore(<Probe />)

    const initial = renders.count

    act(() => {
      store.setState((s) => ({ view: { ...s.view, loaded: true } }))
    })
    expect(renders.count).toBe(initial)

    act(() => {
      store.setState((s) => ({
        viewerSettings: { ...s.viewerSettings, width: 1234 },
      }))
    })
    expect(renders.count).toBe(initial + 1)
  })
})
