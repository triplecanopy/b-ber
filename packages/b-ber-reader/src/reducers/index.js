import { combineReducers } from 'redux'
import viewerSettings from './viewer-settings'
import markers from './markers'

const reducers = {
  viewerSettings,
  markers,
}

const combinedReducers = combineReducers(reducers)

export default combinedReducers
