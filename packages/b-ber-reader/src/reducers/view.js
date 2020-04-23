import * as actionTypes from '../constants/view'

const initialState = { loaded: false, pendingDeferred: true }

const view = (state = initialState, action) => {
  switch (action.type) {
    case actionTypes.LOAD:
      return { ...state, loaded: true }

    case actionTypes.UNLOAD:
      return { ...state, loaded: false }

    case actionTypes.UPDATE_DEFERRED_STATUS:
      return { ...state, pendingDeferred: action.payload }

    default:
      return state
  }
}

export default view
