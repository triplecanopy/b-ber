/* eslint-disable import/prefer-default-export */
import * as actionTypes from '../constants/view'

export const load = () => ({
  type: actionTypes.LOAD,
})

export const unload = () => ({
  type: actionTypes.UNLOAD,
})

export const updateUltimateNodePosition = position => ({
  type: actionTypes.UPDATE_ULTIMATE_NODE_POSITION,
  payload: position,
})

export const queueDeferredCallbacks = () => ({
  type: actionTypes.QUEUE_DEFERRED_CALLBACKS,
  payload: true,
})

export const dequeueDeferredCallbacks = () => ({
  type: actionTypes.DEQUEUE_DEFERRED_CALLBACKS,
  payload: false,
})
