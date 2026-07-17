import { render } from '@testing-library/react'
import React from 'react'
import { createReaderStore } from '../../src/store/createReaderStore'
import { createInitialState } from '../../src/store/initialState'
import { StoreProvider } from '../../src/store/StoreContext'

/**
 * Create a built-in reader store for tests, seeded like the real reader.
 * `overrides` is a partial RootState; `readerSettings` is merged into the
 * defaults, other slices replace the default.
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
 * Render `ui` wrapped in the built-in `StoreProvider`. Returns the RTL result
 * plus the `store` so tests can drive state via `store.setState(...)`.
 */
export function renderWithStore(ui, { overrides, store, ...options } = {}) {
  const readerStore = store || createTestReaderStore(overrides)
  const result = render(
    <StoreProvider store={readerStore}>{ui}</StoreProvider>,
    options
  )
  return { ...result, store: readerStore }
}
