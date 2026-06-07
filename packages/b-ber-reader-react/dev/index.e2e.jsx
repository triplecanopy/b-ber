import React from 'react'
import { createRoot } from 'react-dom/client'
import Reader from '../src'

function App() {
  return <Reader manifestURL={import.meta.env.VITE_MANIFEST_URL} />
}

const root = createRoot(document.getElementById('root'))
root.render(<App />)
