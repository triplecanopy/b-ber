import * as actionTypes from '../constants/markers'

const initialState = {}

const updateMarker = (state, { markerId, ...nextState }) => ({
  ...state,
  [markerId]: {
    ...(state[markerId] || {}),
    ...nextState,
  },
})

const markers = (state = initialState, action) => {
  switch (action.type) {
    case actionTypes.UPDATE:
      return updateMarker(state, action.payload)

    default:
      return state
  }
}

export default markers
