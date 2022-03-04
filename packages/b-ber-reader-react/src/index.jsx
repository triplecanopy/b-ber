import React from 'react'
import { render } from 'react-dom'
import { createStore, applyMiddleware, compose } from 'redux'
import { Provider } from 'react-redux'
import thunk from 'redux-thunk'
import combinedReducers from './reducers'
import { initialState as initialReaderSettings } from './reducers/reader-settings'
import { mergeDeep } from './helpers/utils'
import { App } from './components'

import './lib/polyfills'
// import './index.scss'

const serverData = window.__SERVER_DATA__ || {}
const store = createStore(
  combinedReducers,
  { readerSettings: mergeDeep(initialReaderSettings, serverData) },
  compose(applyMiddleware(thunk))
)

delete window.__SERVER_DATA__
const script = document.querySelector('#__server_data__')
if (script?.parentNode) script.parentNode.removeChild(script)

render(
  <Provider store={store}>
    <App />
  </Provider>,
  document.getElementById('root')
)
