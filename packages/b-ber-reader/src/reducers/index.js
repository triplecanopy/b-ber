import { combineReducers } from 'redux'
import viewerSettings from './viewer-settings'
import markers from './markers'
import view from './view'

const reducers = {
  viewerSettings,
  markers,
  view,
}

const combinedReducers = combineReducers(reducers)

export default combinedReducers
