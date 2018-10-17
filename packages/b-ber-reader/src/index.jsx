import React from 'react'
import { render } from 'react-dom'
import { App } from './components'

import './lib/polyfills'
import './index.scss'

const { __SERVER_DATA__ } = window
delete window.__SERVER_DATA__
const script = document.querySelector('#__server_data__')
if (script && script.parentNode) script.parentNode.removeChild(script)

render(<App {...__SERVER_DATA__} />, document.getElementById('root'))
