import * as actionTypes from '../constants/viewer-settings'
import Storage from '../helpers/Storage'
import type { AppThunk, ViewerSettingsState } from '../store/types'

// const useLocalStorage = false // TODO

export const load = (): AppThunk => (dispatch) => {
  // TODO
  // const storage = Storage.set(LOCALSTORAGE_KEY)

  return dispatch({
    type: actionTypes.SETTINGS_LOAD,
    // payload: viewerSettings, // TODO
  })
}

export const save = (): AppThunk => (dispatch, getState) => {
  // if (useLocalStorage === false || this.state.cache === false) return

  const { viewerSettings } = getState()
  const storage = { viewerSettings }

  Storage.set(storage)

  return dispatch({
    type: actionTypes.SETTINGS_SAVE,
    payload: viewerSettings,
  })
}

export const update =
  (settings: Partial<ViewerSettingsState> = {}): AppThunk =>
  (dispatch) => {
    // if (useLocalStorage === false || this.state.cache === false) return

    return dispatch({
      type: actionTypes.SETTINGS_UPDATE,
      payload: settings,
    })
  }
