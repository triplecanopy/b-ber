import React from 'react'
// import { render } from 'react-dom'
import { createRoot } from 'react-dom/client'
import Reader from '@canopycanopycanopy/b-ber-reader-react'
import '@canopycanopycanopy/b-ber-reader-react/dist/styles.css'

// render(
//   <Reader {...(window.__SERVER_DATA__ || {})} />,
//   document.getElementById('root')
// )

const container = document.getElementById('root')
const root = createRoot(container)
// eslint-disable-next-line react/jsx-props-no-spreading
root.render(<Reader {...(window.__SERVER_DATA__ || {})} />)
