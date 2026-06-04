import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import { fileURLToPath } from 'url'
import { defineConfig } from 'vite'

const __dirname = fileURLToPath(new URL('.', import.meta.url))

export default defineConfig({
  plugins: [react({ include: /\.(jsx?|tsx?)$/ })],
  resolve: {
    // Prevent duplicate React instances when b-ber-reader-react is symlinked
    alias: {
      react: resolve(__dirname, '../../node_modules/react'),
      'react-dom': resolve(__dirname, '../../node_modules/react-dom'),
    },
  },
  build: {
    target: 'es2022',
    outDir: 'dist',
    // b-ber-reader-react is a symlink that resolves outside node_modules,
    // so the default CJS include pattern misses it — add it explicitly.
    commonjsOptions: {
      include: [/node_modules/, /b-ber-reader-react\/dist/],
    },
  },
})
