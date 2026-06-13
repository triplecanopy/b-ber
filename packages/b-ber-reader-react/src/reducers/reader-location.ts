import * as actionTypes from '../constants/reader-location'
import type { ReaderLocationState, ReducerAction } from '../store/types'

const defaultState: ReaderLocationState = {
  searchParams: '',
}

const readerLocation = (
  state: ReaderLocationState = defaultState,
  action: ReducerAction = { type: '' }
): ReaderLocationState => {
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
