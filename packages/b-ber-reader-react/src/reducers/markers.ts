import * as actionTypes from '../constants/markers'
import type { MarkersState, ReducerAction } from '../store/types'

const initialState: MarkersState = {}

interface MarkerUpdatePayload {
  markerId: string
  [key: string]: unknown
}

const updateMarker = (
  state: MarkersState,
  { markerId, ...nextState }: MarkerUpdatePayload
): MarkersState => ({
  ...state,
  [markerId]: {
    ...(state[markerId] || {}),
    ...nextState,
  },
})

const markers = (
  state: MarkersState = initialState,
  action: ReducerAction = { type: '' }
): MarkersState => {
  switch (action.type) {
    case actionTypes.UPDATE:
      return updateMarker(state, action.payload)

    default:
      return state
  }
}

export default markers
