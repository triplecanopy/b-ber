import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import { fileURLToPath } from 'url'
import { defineConfig } from 'vite'

const __dirname = fileURLToPath(new URL('.', import.meta.url))

export default defineConfig({
  plugins: [react({ include: /\.(jsx?|tsx?)$/ })],
  resolve: {
    alias: {
      // Bundle b-ber-reader-react from SOURCE in a single pass rather than
      // consuming its pre-built dist. The dist is a rolldown lib bundle that
      // externalizes React; its CJS sub-deps (react-player, react-fast-compare,
      // …) compile `require('react')` into a baked-in rolldown require shim
      // that throws in the browser when re-bundled here. Building from source
      // resolves React exactly once for the whole tree, avoiding the shim.
      '@canopycanopycanopy/b-ber-reader-react': resolve(
        __dirname,
        '../b-ber-reader-react/src/index.jsx'
      ),
      // Node-builtin shims needed by b-ber-reader-react's dependency graph.
      // Mirrors b-ber-reader-react/vite.config.js, which we now bypass.
      stream: 'stream-browserify',
      buffer: 'buffer/',
      os: 'os-browserify/browser',
      // Prevent duplicate React instances when b-ber-reader-react is symlinked
      react: resolve(__dirname, '../../node_modules/react'),
      'react-dom': resolve(__dirname, '../../node_modules/react-dom'),
    },
  },
  build: {
    target: 'es2022',
    outDir: 'dist',
  },
})
