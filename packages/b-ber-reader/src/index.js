import React from 'react'
import { createRoot } from 'react-dom/client'
import Reader from '@canopycanopycanopy/b-ber-reader-react'
import '@canopycanopycanopy/b-ber-reader-react/dist/styles.css'

const root = createRoot(document.getElementById('root'))
// eslint-disable-next-line react/jsx-props-no-spreading
root.render(<Reader {...(window.__SERVER_DATA__ || {})} />)
