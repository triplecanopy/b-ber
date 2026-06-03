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
    readerSettings: mergeDeep(
      initialReaderSettings,
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
