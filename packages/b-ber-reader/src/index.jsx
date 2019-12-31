import React from 'react'
import { render } from 'react-dom'
import { createStore, applyMiddleware, compose } from 'redux'
import { Provider } from 'react-redux'
import thunk from 'redux-thunk'
import combinedReducers from './reducers'
import { App } from './components'

import './lib/polyfills'
import './index.scss'

const store = createStore(
  combinedReducers,
  window.__SERVER_DATA__,
  compose(applyMiddleware(thunk))
)

delete window.__SERVER_DATA__
const script = document.querySelector('#__server_data__')
if (script && script.parentNode) script.parentNode.removeChild(script)

render(
  <Provider store={store}>
    <App />
  </Provider>,
  document.getElementById('root')
)
