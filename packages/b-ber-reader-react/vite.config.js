/* eslint-disable import/no-unresolved */

import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react({ include: /\.(jsx?|tsx?)$/ })],
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
    open: true,
  },
})
