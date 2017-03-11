
/* eslint-disable import/prefer-default-export */

import * as actionType from './constants'
import reducer from './reducer'

export function setBber(props) {
  return reducer({ type: actionType.SET_BBER, ...props })
}

export function getBber(...props) {
  return reducer({ type: actionType.GET_BBER, props })
}
