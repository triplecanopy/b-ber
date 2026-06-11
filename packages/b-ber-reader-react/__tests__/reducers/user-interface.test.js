import * as actionTypes from '../../src/constants/user-interface'
import userInterface from '../../src/reducers/user-interface'

const initialState = {
  enableTransitions: false,
  handleEvents: false,
  spinnerVisible: true,
}

describe('reducers/user-interface', () => {
  test('returns the initial state', () => {
    expect(userInterface(undefined, {})).toEqual(initialState)
  })

  test('handles PAGE_TRANSITIONS_UPDATE', () => {
    const action = { type: actionTypes.PAGE_TRANSITIONS_UPDATE, payload: true }

    expect(userInterface(initialState, action)).toEqual({
      ...initialState,
      enableTransitions: true,
    })
  })

  test('handles EVENT_HANDLING_UPDATE', () => {
    const action = { type: actionTypes.EVENT_HANDLING_UPDATE, payload: true }

    expect(userInterface(initialState, action)).toEqual({
      ...initialState,
      handleEvents: true,
    })
  })

  test('handles SPINNER_UPDATE', () => {
    const action = { type: actionTypes.SPINNER_UPDATE, payload: false }

    expect(userInterface(initialState, action)).toEqual({
      ...initialState,
      spinnerVisible: false,
    })
  })

  test('handles UPDATE', () => {
    const action = {
      type: actionTypes.UPDATE,
      payload: { handleEvents: true, spinnerVisible: false },
    }

    expect(userInterface(initialState, action)).toEqual({
      ...initialState,
      handleEvents: true,
      spinnerVisible: false,
    })
  })

  test('returns unchanged state for unknown action types', () => {
    expect(userInterface(initialState, { type: 'UNKNOWN' })).toBe(initialState)
  })
})
