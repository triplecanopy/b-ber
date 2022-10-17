import * as actionTypes from '../constants/reader-location'

const defaultState = {
  searchParams: '',
}

const readerLocation = (state = defaultState, action = {}) => {
  switch (action.type) {
    case actionTypes.LOCATION_UPDATE:
      return {
        ...state,
        ...action.payload,
      }

    default:
      return state
  }
}

export default readerLocation
