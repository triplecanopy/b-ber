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
  build: {
    lib: {
      entry: 'src/index.jsx',
      name: 'BberReader',
      formats: ['umd'],
      fileName: () => 'index.js',
    },
    rollupOptions: {
      external: ['react', 'react-dom'],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
        },
        assetFileNames: assetInfo => {
          if ((assetInfo.names?.[0] ?? '').endsWith('.css')) return 'styles.css'
          return '[name][extname]'
        },
      },
    },
  },
})
