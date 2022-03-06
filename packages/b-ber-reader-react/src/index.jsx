import React from 'react'
import { createStore, applyMiddleware, compose } from 'redux'
import { Provider } from 'react-redux'
import thunk from 'redux-thunk'
import combinedReducers from './reducers'
import { initialState as initialReaderSettings } from './reducers/reader-settings'
import { mergeDeep } from './helpers/utils'
import { App } from './components'

import './lib/polyfills'

const ConnectedApp = (props = {}) => {
  const store = createStore(
    combinedReducers,
    { readerSettings: mergeDeep(initialReaderSettings, props) },
    compose(applyMiddleware(thunk))
  )

  return (
    <Provider store={store}>
      <App />
    </Provider>
  )
}

export default ConnectedApp
