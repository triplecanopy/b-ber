import { combineReducers } from 'redux'
import readerSettings from './reader-settings'
import viewerSettings from './viewer-settings'
import readerLocation from './reader-location'
import markers from './markers'
import view from './view'

const reducers = {
  readerSettings,
  viewerSettings,
  readerLocation,
  markers,
  view,
}

const combinedReducers = combineReducers(reducers)

export default combinedReducers
