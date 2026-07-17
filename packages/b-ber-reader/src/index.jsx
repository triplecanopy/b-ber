// Styles come from b-ber-reader-react's source (its index.scss, including the
// inline SVG icon components under src/components/Icons/), pulled in via the
// source bundle aliased in vite.config.js — no separate dist CSS.
import Reader from '@canopycanopycanopy/b-ber-reader-react'
import React from 'react'
import { createRoot } from 'react-dom/client'

const root = createRoot(document.getElementById('root'))
// eslint-disable-next-line react/jsx-props-no-spreading
root.render(<Reader {...(window.__SERVER_DATA__ || {})} />)
