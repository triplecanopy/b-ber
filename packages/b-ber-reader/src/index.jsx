import React from 'react'
import {render} from 'react-dom'
import {App} from './components'

import './lib/polyfills'
import './index.scss'

render((
    <App />
), document.getElementById('root'))
