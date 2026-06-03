import React from 'react'
import { Provider } from 'react-redux'
import { applyMiddleware, compose, createStore } from 'redux'
import { thunk } from 'redux-thunk'
import { App } from './components'
import { mergeDeep } from './helpers/utils'
import version from './lib/version'
import combinedReducers from './reducers'
import { initialState as initialReaderSettings } from './reducers/reader-settings'

import './lib/polyfills'
import 'material-icons/iconfont/filled.css'
import './index.scss'

const Version = () => (
  <meta name="generator" content={`b-ber-react-reader: ${version}`} />
)

const ConnectedApp = (props = {}) => {
  const store = createStore(
    combinedReducers,
    { readerSettings: mergeDeep(initialReaderSettings, props) },
    compose(applyMiddleware(thunk))
  )

  return (
    <Provider store={store}>
      <Version />
      <App />
    </Provider>
  )
}

export default ConnectedApp
