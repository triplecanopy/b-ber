import * as actionTypes from '../constants/markers'

export interface MarkerUpdatePayload {
  markerId: string
  [key: string]: unknown
}

export const update = (data: MarkerUpdatePayload) => ({
  type: actionTypes.UPDATE,
  payload: data,
})
