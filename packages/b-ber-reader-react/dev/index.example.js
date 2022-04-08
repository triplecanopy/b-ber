import React from 'react'
import { render } from 'react-dom'
import Reader from '../src'

function App() {
  return <Reader manifestURL="http://example.com/manifest.json" />
}

render(<App />, document.getElementById('root'))
