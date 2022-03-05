import React from 'react'
import { render } from 'react-dom'
import Reader from '@canopycanopycanopy/b-ber-reader-react'
import '@canopycanopycanopy/b-ber-reader-react/dist/styles.css'

render(
  <Reader props={window.__SERVER_DATA__ || {}} />,
  document.getElementById('root')
)
