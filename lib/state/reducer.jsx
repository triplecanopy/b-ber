
import * as actionType from './constants'
import initialState from './store'

let state = initialState

function _get({ props }) {
  const args = Array.prototype.slice.call(props, 0)
  const res = {}
  let prop

  while ((prop = args.pop())) {
    if ({}.hasOwnProperty.call(state, prop)) {
      res[prop] = state[prop]
    }
  }
  return res
}

const reducer = (props) => {
  const { type } = props
  switch (type) {
    case actionType.SET_BBER:
      state = Object.assign({}, state, props, { lastActionType: type })
      return state
    case actionType.GET_BBER:
      return _get(props)
    default:
      return state
  }
}

export default reducer
