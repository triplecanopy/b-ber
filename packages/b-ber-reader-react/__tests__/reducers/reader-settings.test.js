import * as actionTypes from '../../src/constants/reader-settings'
import readerSettings, {
  initialState,
} from '../../src/reducers/reader-settings'

describe('reducers/reader-settings', () => {
  test('returns the initial state', () => {
    expect(readerSettings(undefined, {})).toEqual(initialState)
  })

  test('handles SETTINGS_UPDATE', () => {
    const action = {
      type: actionTypes.SETTINGS_UPDATE,
      payload: { layout: 'scroll' },
    }

    expect(readerSettings(initialState, action)).toEqual({
      ...initialState,
      layout: 'scroll',
    })
  })

  test('returns unchanged state for unknown action types', () => {
    expect(readerSettings(initialState, { type: 'UNKNOWN' })).toBe(initialState)
  })
})
