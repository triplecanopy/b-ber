import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react({ include: /\.(jsx?|tsx?)$/ })],
  build: {
    target: 'es2022',
    lib: {
      entry: 'src/index.jsx',
      name: 'BberReader',
      // ES output (not UMD): this lib is re-bundled by b-ber-reader's own Vite
      // build. UMD's hand-rolled interop binds the external react as a raw
      // global, so the default-import interop breaks (`React.default` is
      // undefined) once re-bundled, crashing every class component with
      // "Cannot read properties of undefined (reading 'prototype')". ESM keeps
      // `import React from 'react'` intact so the consuming bundler wires up
      // React with correct interop.
      formats: ['es'],
      fileName: () => 'index.js',
    },
    rollupOptions: {
      external: ['react', 'react-dom'],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
        },
        assetFileNames: (assetInfo) => {
          if ((assetInfo.names?.[0] ?? '').endsWith('.css')) return 'styles.css'
          return '[name][extname]'
        },
      },
    },
  },
})
