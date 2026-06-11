import * as actionTypes from '../../src/constants/view'
import view from '../../src/reducers/view'

const initialState = {
  loaded: false,
  ultimateOffsetLeft: 0,
  lastSpreadIndex: 0,
}

describe('reducers/view', () => {
  test('returns the initial state', () => {
    expect(view(initialState, {})).toEqual(initialState)
  })

  test('handles LOAD', () => {
    const action = { type: actionTypes.LOAD, payload: true }
    expect(view(initialState, action)).toEqual({
      ...initialState,
      loaded: true,
    })
  })

  test('handles UNLOAD', () => {
    const loadedState = { ...initialState, loaded: true }
    const action = { type: actionTypes.UNLOAD, payload: false }
    expect(view(loadedState, action)).toEqual({
      ...initialState,
      loaded: false,
    })
  })

  test('handles UPDATE_ULTIMATE_NODE_POSITION', () => {
    const action = {
      type: actionTypes.UPDATE_ULTIMATE_NODE_POSITION,
      payload: { ultimateOffsetLeft: 42 },
    }

    expect(view(initialState, action)).toEqual({
      ...initialState,
      ultimateOffsetLeft: 42,
    })
  })

  test('handles UPDATE_LAST_SPREAD_INDEX', () => {
    const action = {
      type: actionTypes.UPDATE_LAST_SPREAD_INDEX,
      payload: 5,
    }

    expect(view(initialState, action)).toEqual({
      ...initialState,
      lastSpreadIndex: 5,
    })
  })

  test('handles QUEUE_DEFERRED_CALLBACKS', () => {
    const action = { type: actionTypes.QUEUE_DEFERRED_CALLBACKS, payload: true }
    expect(view(initialState, action)).toEqual(initialState)
  })

  test('handles DEQUEUE_DEFERRED_CALLBACKS', () => {
    const action = {
      type: actionTypes.DEQUEUE_DEFERRED_CALLBACKS,
      payload: false,
    }
    expect(view(initialState, action)).toEqual(initialState)
  })

  test('returns unchanged state for unknown action types', () => {
    expect(view(initialState, { type: 'UNKNOWN' })).toBe(initialState)
  })
})
