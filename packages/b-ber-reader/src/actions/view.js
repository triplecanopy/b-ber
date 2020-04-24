/* eslint-disable import/prefer-default-export */
import * as actionTypes from '../constants/view'

export const load = () => ({
  type: actionTypes.LOAD,
})

export const unload = () => ({
  type: actionTypes.UNLOAD,
})

export const setUltimateLeft = pos => ({
  type: 'SET_POS',
  payload: pos,
})
