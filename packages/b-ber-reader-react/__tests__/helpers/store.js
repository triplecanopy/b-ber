import { applyMiddleware, compose, createStore } from 'redux'
import { thunk } from 'redux-thunk'
import { mergeDeep } from '../../src/helpers/utils'
import combinedReducers from '../../src/reducers'
import { initialState as initialReaderSettings } from '../../src/reducers/reader-settings'

/**
 * Create a real Redux store for smoke tests.
 * Pass `overrides` to pre-populate any slice of state.
 *
 * Examples:
 *   createTestStore()
 *   createTestStore({ userInterface: { spinnerVisible: false, handleEvents: true } })
 *   createTestStore({ readerSettings: { layout: 'scroll' } })
 */
export function createTestStore(overrides = {}) {
  const { readerSettings: readerSettingsOverride, ...rest } = overrides

  const initialState = {
    // mergeDeep mutates its first argument in place, so clone
    // initialReaderSettings to avoid leaking overrides from one test's store
    // into the shared module-level initial state used by other tests.
    readerSettings: mergeDeep(
      JSON.parse(JSON.stringify(initialReaderSettings)),
      readerSettingsOverride || {}
    ),
    ...rest,
  }

  return createStore(
    combinedReducers,
    initialState,
    compose(applyMiddleware(thunk))
  )
}
