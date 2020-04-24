import * as actionTypes from '../constants/view'

const initialState = { loaded: false, left: 0 }

const view = (state = initialState, action) => {
  switch (action.type) {
    case actionTypes.LOAD:
      return { ...state, loaded: true }

    case actionTypes.UNLOAD:
      return { ...state, loaded: false }
    case 'SET_POS':
      return { ...state, left: action.payload }

    default:
      return state
  }
}

export default view
