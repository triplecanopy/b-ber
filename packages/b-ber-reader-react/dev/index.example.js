import React from 'react'
// import { render } from 'react-dom'
import { createRoot } from 'react-dom/client'
import Reader from '../src'

function App() {
  return <Reader manifestURL="http://example.com/manifest.json" />
}

// render(<App />, document.getElementById('root'))
const container = document.getElementById('root')
const root = createRoot(container)
root.render(<App />)
