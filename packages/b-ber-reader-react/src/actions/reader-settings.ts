import * as actionTypes from '../constants/reader-settings'
import type { ReaderSettingsState } from '../store/types'

export const updateSettings = (data: Partial<ReaderSettingsState>) => ({
  type: actionTypes.SETTINGS_UPDATE,
  payload: data,
})
