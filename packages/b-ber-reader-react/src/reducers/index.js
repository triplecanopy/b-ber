import { combineReducers } from 'redux'
import readerSettings from './reader-settings'
import viewerSettings from './viewer-settings'
import readerLocation from './reader-location'
import markers from './markers'
import view from './view'
import userInterface from './user-interface'

const reducers = {
  readerSettings,
  viewerSettings,
  readerLocation,
  markers,
  view,
  userInterface,
}

const combinedReducers = combineReducers(reducers)

export default combinedReducers
