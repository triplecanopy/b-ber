/* eslint-disable arrow-body-style */
import * as actionTypes from '../constants/viewer-settings'
import Storage from '../helpers/Storage'

// const useLocalStorage = false // TODO

const LOCALSTORAGE_KEY = 'bber_reader'

export const load = () => dispatch => {
  // TODO
  // const storage = Storage.set(LOCALSTORAGE_KEY)

  return dispatch({
    type: actionTypes.SETTINGS_LOAD,
    // payload: viewerSettings, // TODO
  })
}

export const save = () => (dispatch, getState) => {
  // if (useLocalStorage === false || this.state.cache === false) return

  const { viewerSettings } = getState()
  const storage = { viewerSettings }

  Storage.set(LOCALSTORAGE_KEY, storage)

  return dispatch({
    type: actionTypes.SETTINGS_SAVE,
    payload: viewerSettings,
  })
}

export const update = (settings = {}) => dispatch => {
  // if (useLocalStorage === false || this.state.cache === false) return

  return dispatch({
    type: actionTypes.SETTINGS_UPDATE,
    payload: settings,
  })
}
