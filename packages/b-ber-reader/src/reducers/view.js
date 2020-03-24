import * as actionTypes from '../constants/view'

const initialState = { loaded: false }

const view = (state = initialState, action) => {
  switch (action.type) {
    case actionTypes.LOAD:
      return { loaded: true }

    case actionTypes.UNLOAD:
      return { loaded: false }

    default:
      return state
  }
}

export default view
