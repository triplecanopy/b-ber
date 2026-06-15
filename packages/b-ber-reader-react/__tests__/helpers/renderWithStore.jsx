import { render } from '@testing-library/react'
import React from 'react'
import { Provider } from 'react-redux'
import { createReaderStore } from '../../src/store/createReaderStore'
import { createInitialState } from '../../src/store/initialState'
import { StoreProvider } from '../../src/store/StoreContext'
import { createTestStore } from './store'

/**
 * Create a built-in reader store for tests, seeded like the real reader.
 * `overrides` is a partial RootState; `readerSettings` is merged into the
 * defaults (matching `createTestStore`), other slices replace the default.
 *
 * Examples:
 *   createTestReaderStore()
 *   createTestReaderStore({ userInterface: { spinnerVisible: false } })
 *   createTestReaderStore({ readerSettings: { layout: 'scroll' } })
 */
export function createTestReaderStore(overrides = {}) {
  const { readerSettings: readerSettingsOverride, ...rest } = overrides
  const store = createReaderStore(
    createInitialState(readerSettingsOverride || {})
  )
  if (Object.keys(rest).length > 0) {
    store.setState((state) => {
      const patch = {}
      for (const [slice, value] of Object.entries(rest)) {
        patch[slice] = { ...state[slice], ...value }
      }
      return patch
    })
  }
  return store
}

/**
 * Render `ui` wrapped in a built-in `StoreProvider`. Returns the RTL result
 * plus the `store` so tests can drive state via `store.setState(...)`.
 * The slice-by-slice replacement for the redux `Provider` + `createTestStore`
 * pattern (TASK-106).
 */
export function renderWithStore(ui, { overrides, store, ...options } = {}) {
  const readerStore = store || createTestReaderStore(overrides)
  const result = render(
    <StoreProvider store={readerStore}>{ui}</StoreProvider>,
    options
  )
  return { ...result, store: readerStore }
}

/**
 * Render `ui` wrapped in BOTH the redux `Provider` and the built-in
 * `StoreProvider`, each seeded from the same `overrides`. Used during the
 * slice-by-slice migration (TASK-106) for components that still read some
 * slices from redux while others have moved to the built-in store. Drops to
 * `renderWithStore` once a component is fully off redux.
 */
export function renderWithStores(ui, { overrides = {}, ...options } = {}) {
  const reduxStore = createTestStore(overrides)
  const readerStore = createTestReaderStore(overrides)
  const result = render(
    <Provider store={reduxStore}>
      <StoreProvider store={readerStore}>{ui}</StoreProvider>
    </Provider>,
    options
  )
  return { ...result, reduxStore, readerStore }
}
