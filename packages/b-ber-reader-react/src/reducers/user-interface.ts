import * as actionTypes from '../constants/user-interface'
import type { ReducerAction, UserInterfaceState } from '../store/types'

const initialState: UserInterfaceState = {
  enableTransitions: false,
  handleEvents: false,
  spinnerVisible: true,
}

const userInterface = (
  state: UserInterfaceState = initialState,
  action: ReducerAction = { type: '' }
): UserInterfaceState => {
  switch (action.type) {
    case actionTypes.PAGE_TRANSITIONS_UPDATE:
      return {
        ...state,
        enableTransitions: action.payload,
      }

    case actionTypes.EVENT_HANDLING_UPDATE:
      return {
        ...state,
        handleEvents: action.payload,
      }

    case actionTypes.SPINNER_UPDATE:
      return {
        ...state,
        spinnerVisible: action.payload,
      }

    case actionTypes.UPDATE:
      return {
        ...state,
        ...action.payload,
      }

    default:
      return state
  }
}

export default userInterface
