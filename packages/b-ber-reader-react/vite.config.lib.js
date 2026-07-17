import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react({ include: /\.(jsx?|tsx?)$/ })],
  resolve: {
    // Node-builtin shims for the browser. `sax` (OPF/NCX parsing) extends
    // Node's `Stream` and uses `Buffer` at runtime — without these the bundle
    // throws "Cannot read properties of undefined (reading 'prototype')" on
    // load. TASK-058 removed these as "dead code", but the analysis missed
    // sax's runtime path (build success + jsdom tests don't exercise it).
    alias: {
      stream: 'stream-browserify',
      buffer: 'buffer/',
      os: 'os-browserify/browser',
    },
  },
  build: {
    target: 'es2022',
    lib: {
      entry: 'src/index.tsx',
      name: 'BberReader',
      // ES output (not UMD): this lib is re-bundled by b-ber-reader's own Vite
      // build. UMD's hand-rolled interop binds the external react as a raw
      // global, so the default-import interop breaks (`React.default` is
      // undefined) once re-bundled, crashing every class component with
      // "Cannot read properties of undefined (reading 'prototype')". ESM keeps
      // `import React from 'react'` intact so the consuming bundler wires up
      // React with correct interop.
      formats: ['es'],
      // `.mjs` so the bundle is unambiguously ESM regardless of the package's
      // `"type"`. The package keeps CommonJS config files (jest.config.js,
      // jest-transform-upward.js, scripts/version.js), so we deliberately do
      // NOT set `"type": "module"` — `.mjs` carries the ESM signal instead.
      // Without this, bundlers that trust package metadata over syntax-sniffing
      // (Vite's esbuild dep optimizer) mis-read the ESM `.js` as CJS and nest
      // the component under `.default` (consumer needs `<Reader.default />`).
      fileName: () => 'index.mjs',
    },
    rollupOptions: {
      external: ['react', 'react-dom'],
      output: {
        // Bundled CJS deps (react-redux's use-sync-external-store, react-player)
        // call `require('react')`. With react externalized + ESM output,
        // rolldown leaves those as runtime `require()` shims that throw
        // "Cannot find module 'react'" in a browser/webpack consumer (no
        // runtime require). Disable rolldown's throwing polyfill and supply our
        // own `require` that resolves react/react-dom from the ESM imports the
        // bundle already declares — works in every consumer (ESM, webpack, the
        // b-ber-reader re-bundle).
        polyfillRequire: false,
        banner: [
          "import * as __bberReact from 'react'",
          "import * as __bberReactDOM from 'react-dom'",
          'function require(id) {',
          "  if (id === 'react') return __bberReact",
          "  if (id === 'react-dom') return __bberReactDOM",
          "  throw new Error('b-ber-reader-react: unexpected require(' + id + ')')",
          '}',
        ].join('\n'),
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
