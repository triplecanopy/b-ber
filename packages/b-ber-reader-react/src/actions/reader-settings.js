/* eslint-disable import/prefer-default-export */
import * as actionTypes from '../constants/reader-settings'

export const updateSettings = data => ({
  type: actionTypes.SETTINGS_UPDATE,
  payload: data,
})
