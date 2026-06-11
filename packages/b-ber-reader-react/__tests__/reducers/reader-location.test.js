import * as actionTypes from '../../src/constants/reader-location'
import readerLocation from '../../src/reducers/reader-location'

describe('reducers/reader-location', () => {
  test('returns the initial state', () => {
    expect(readerLocation(undefined, {})).toEqual({ searchParams: '' })
  })

  test('handles LOCATION_UPDATE', () => {
    const state = { searchParams: '' }
    const action = {
      type: actionTypes.LOCATION_UPDATE,
      payload: { searchParams: 'currentSpineItemIndex=1&spreadIndex=0' },
    }

    expect(readerLocation(state, action)).toEqual({
      searchParams: 'currentSpineItemIndex=1&spreadIndex=0',
    })
  })

  test('returns unchanged state for unknown action types', () => {
    const state = { searchParams: 'foo=bar' }
    expect(readerLocation(state, { type: 'UNKNOWN' })).toBe(state)
  })
})
