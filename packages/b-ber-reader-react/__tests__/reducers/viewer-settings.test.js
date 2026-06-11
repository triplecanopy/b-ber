import * as actionTypes from '../../src/constants/viewer-settings'
import { ViewerSettings } from '../../src/models'
import viewerSettings from '../../src/reducers/viewer-settings'

const initialState = new ViewerSettings().get()

describe('reducers/viewer-settings', () => {
  test('returns the initial state', () => {
    expect(viewerSettings(undefined, {})).toEqual(initialState)
  })

  test('handles SETTINGS_UPDATE', () => {
    const action = {
      type: actionTypes.SETTINGS_UPDATE,
      payload: { fontSize: 20 },
    }

    expect(viewerSettings(initialState, action)).toEqual({
      ...initialState,
      fontSize: 20,
    })
  })

  test('handles SETTINGS_SAVE', () => {
    const action = {
      type: actionTypes.SETTINGS_SAVE,
      payload: { fontSize: 22 },
    }

    expect(viewerSettings(initialState, action)).toEqual({
      ...initialState,
      fontSize: 22,
    })
  })

  test('handles SETTINGS_LOAD', () => {
    const action = {
      type: actionTypes.SETTINGS_LOAD,
      payload: { fontSize: 18 },
    }

    expect(viewerSettings(initialState, action)).toEqual({
      ...initialState,
      fontSize: 18,
    })
  })

  test('returns unchanged state for unknown action types', () => {
    expect(viewerSettings(initialState, { type: 'UNKNOWN' })).toBe(initialState)
  })
})
