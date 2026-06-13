import * as actionTypes from '../constants/viewer-settings'
import { ViewerSettings } from '../models'
import type { ReducerAction, ViewerSettingsState } from '../store/types'

const settings = new ViewerSettings()
const initialState = settings.get() as ViewerSettingsState

const viewerSettings = (
  state: ViewerSettingsState = initialState,
  action: ReducerAction = { type: '' }
): ViewerSettingsState => {
  switch (action.type) {
    case actionTypes.SETTINGS_UPDATE:
    case actionTypes.SETTINGS_SAVE:
    case actionTypes.SETTINGS_LOAD:
      return { ...state, ...action.payload }

    default:
      return state
  }
}

export default viewerSettings
