import React from 'react'
import { createRoot } from 'react-dom/client'
import Reader from '../src'

function App() {
  return <Reader manifestURL="http://example.com/manifest.json" />
}

const root = createRoot(document.getElementById('root'))
root.render(<App />)
