import { combineReducers } from 'redux'
import viewerSettings from './viewer-settings'

const reducers = {
  viewerSettings,
}

const combinedReducers = combineReducers(reducers)

export default combinedReducers
