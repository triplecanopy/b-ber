import {
  dequeueDeferredCallbacks,
  load,
  queueDeferredCallbacks,
  unload,
  updateLastSpreadIndex,
  updateUltimateNodePosition,
} from '../../src/actions/view'
import * as actionTypes from '../../src/constants/view'

describe('actions/view', () => {
  test('load creates a LOAD action', () => {
    expect(load()).toEqual({ type: actionTypes.LOAD, payload: true })
  })

  test('unload creates an UNLOAD action', () => {
    expect(unload()).toEqual({ type: actionTypes.UNLOAD, payload: false })
  })

  test('updateUltimateNodePosition creates an UPDATE_ULTIMATE_NODE_POSITION action', () => {
    const position = { ultimateOffsetLeft: 42 }
    expect(updateUltimateNodePosition(position)).toEqual({
      type: actionTypes.UPDATE_ULTIMATE_NODE_POSITION,
      payload: position,
    })
  })

  test('updateLastSpreadIndex creates an UPDATE_LAST_SPREAD_INDEX action', () => {
    expect(updateLastSpreadIndex(3)).toEqual({
      type: actionTypes.UPDATE_LAST_SPREAD_INDEX,
      payload: 3,
    })
  })

  test('queueDeferredCallbacks creates a QUEUE_DEFERRED_CALLBACKS action', () => {
    expect(queueDeferredCallbacks()).toEqual({
      type: actionTypes.QUEUE_DEFERRED_CALLBACKS,
      payload: true,
    })
  })

  test('dequeueDeferredCallbacks creates a DEQUEUE_DEFERRED_CALLBACKS action', () => {
    expect(dequeueDeferredCallbacks()).toEqual({
      type: actionTypes.DEQUEUE_DEFERRED_CALLBACKS,
      payload: false,
    })
  })
})
