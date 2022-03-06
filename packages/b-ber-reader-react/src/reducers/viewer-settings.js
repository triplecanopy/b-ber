import * as actionTypes from '../constants/viewer-settings'
import { ViewerSettings } from '../models'

const settings = new ViewerSettings()
const initialState = settings.get()

const viewerSettings = (state = initialState, action) => {
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
