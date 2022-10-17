/* eslint-disable import/prefer-default-export */
import * as actionTypes from '../constants/view'

export const load = () => ({
  type: actionTypes.LOAD,
  payload: true,
})

export const unload = () => ({
  type: actionTypes.UNLOAD,
  payload: false,
})

export const updateUltimateNodePosition = position => ({
  type: actionTypes.UPDATE_ULTIMATE_NODE_POSITION,
  payload: position,
})

export const updateLastSpreadIndex = index => ({
  type: actionTypes.UPDATE_LAST_SPREAD_INDEX,
  payload: index,
})

export const queueDeferredCallbacks = () => ({
  type: actionTypes.QUEUE_DEFERRED_CALLBACKS,
  payload: true,
})

export const dequeueDeferredCallbacks = () => ({
  type: actionTypes.DEQUEUE_DEFERRED_CALLBACKS,
  payload: false,
})
