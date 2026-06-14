import { createReaderStore } from '../../src/store/createReaderStore'

const baseState = {
  view: { loaded: false, lastSpreadIndex: 0, ultimateOffsetLeft: 0 },
  userInterface: { spinnerVisible: true },
}

describe('createReaderStore', () => {
  test('getSnapshot returns the seeded state', () => {
    const store = createReaderStore(baseState)
    expect(store.getSnapshot()).toBe(baseState)
  })

  test('setState shallow-merges at the slice level and notifies listeners', () => {
    const store = createReaderStore({ ...baseState })
    const listener = jest.fn()
    store.subscribe(listener)

    store.setState({ userInterface: { spinnerVisible: false } })

    expect(listener).toHaveBeenCalledTimes(1)
    expect(store.getSnapshot().userInterface).toEqual({ spinnerVisible: false })
    // Untouched slices keep their identity
    expect(store.getSnapshot().view).toBe(baseState.view)
  })

  test('setState accepts a functional patch reading previous state', () => {
    const store = createReaderStore({ ...baseState })

    store.setState((s) => ({ view: { ...s.view, loaded: true } }))

    expect(store.getSnapshot().view).toEqual({
      loaded: true,
      lastSpreadIndex: 0,
      ultimateOffsetLeft: 0,
    })
  })

  test('unsubscribe stops notifications', () => {
    const store = createReaderStore({ ...baseState })
    const listener = jest.fn()
    const unsubscribe = store.subscribe(listener)

    unsubscribe()
    store.setState({ userInterface: { spinnerVisible: false } })

    expect(listener).not.toHaveBeenCalled()
  })
})
