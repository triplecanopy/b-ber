/* eslint-disable import/no-unresolved */

import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Replace the dev entry script with the e2e-specific entry that reads
// VITE_MANIFEST_URL from the environment. transformIndexHtml runs on every
// request for the HTML entry, so it is always current.
function e2eEntryPlugin() {
  return {
    name: 'e2e-entry',
    transformIndexHtml: {
      order: 'pre',
      handler(html) {
        return html.replace('./index.jsx', './index.e2e.jsx')
      },
    },
  }
}

export default defineConfig({
  plugins: [react({ include: /\.(jsx?|tsx?)$/ }), e2eEntryPlugin()],
  resolve: {
    alias: {
      stream: 'stream-browserify',
      buffer: 'buffer/',
      os: 'os-browserify/browser',
    },
  },
  root: 'dev',
  server: {
    port: 3000,
    open: false,
  },
})
