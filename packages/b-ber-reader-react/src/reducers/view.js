import * as actionTypes from '../constants/view'

const initialState = {
  loaded: false,
  // pendingDeferredCallbacks: true,
  ultimateOffsetLeft: 0,
  lastSpreadIndex: 0,
}

const view = (state = initialState, action) => {
  // console.log('view', action)
  switch (action.type) {
    case actionTypes.LOAD:
    case actionTypes.UNLOAD:
      return { ...state, loaded: action.payload }

    case actionTypes.UPDATE_ULTIMATE_NODE_POSITION:
      return { ...state, ...action.payload }

    case actionTypes.UPDATE_LAST_SPREAD_INDEX:
      return { ...state, lastSpreadIndex: action.payload }

    case actionTypes.QUEUE_DEFERRED_CALLBACKS:
    case actionTypes.DEQUEUE_DEFERRED_CALLBACKS:
      return {
        ...state,
        // pendingDeferredCallbacks: action.payload,
      }

    default:
      return state
  }
}

export default view
