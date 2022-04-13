import * as actionTypes from '../constants/user-interface'

// Bulk update
export const update = payload => ({
  type: actionTypes.UPDATE,
  payload,
})

export const enablePageTransitions = () => ({
  type: actionTypes.PAGE_TRANSITIONS_UPDATE,
  payload: true,
})

export const disablePageTransitions = () => ({
  type: actionTypes.PAGE_TRANSITIONS_UPDATE,
  payload: false,
})

export const enableEventHandling = () => ({
  type: actionTypes.EVENT_HANDLING_UPDATE,
  payload: true,
})

export const disableEventHandling = () => ({
  type: actionTypes.EVENT_HANDLING_UPDATE,
  payload: false,
})

export const showSpinner = () => ({
  type: actionTypes.SPINNER_UPDATE,
  payload: true,
})

export const hideSpinner = () => ({
  type: actionTypes.SPINNER_UPDATE,
  payload: false,
})
