import { combineReducers } from 'redux'
import readerSettings from './reader-settings'
import viewerSettings from './viewer-settings'
import markers from './markers'
import view from './view'

const reducers = {
  readerSettings,
  viewerSettings,
  markers,
  view,
}

const combinedReducers = combineReducers(reducers)

export default combinedReducers
