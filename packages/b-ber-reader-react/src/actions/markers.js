/* eslint-disable import/prefer-default-export */
import * as actionTypes from '../constants/markers'

export const update = data => ({
  type: actionTypes.UPDATE,
  payload: data,
})
