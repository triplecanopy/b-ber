import { combineReducers } from 'redux'
import markers from './markers'
import readerLocation from './reader-location'
import readerSettings from './reader-settings'
import userInterface from './user-interface'
import view from './view'
import viewerSettings from './viewer-settings'

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
