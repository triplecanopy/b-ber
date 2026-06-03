/* eslint-disable import/no-unresolved */
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

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
