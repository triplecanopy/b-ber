/* eslint-disable import/prefer-default-export */
import * as actionTypes from '../constants/view'

export const load = () => ({
  type: actionTypes.LOAD,
})

export const unload = () => ({
  type: actionTypes.UNLOAD,
})

export const deferredCallbackQueueResolve = () => ({
  type: actionTypes.UPDATE_DEFERRED_STATUS,
  payload: false,
})

export const deferredCallbackQueueReset = () => ({
  type: actionTypes.UPDATE_DEFERRED_STATUS,
  payload: true,
})
