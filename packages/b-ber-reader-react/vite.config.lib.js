import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react({ include: /\.(jsx?|tsx?)$/ })],
  build: {
    target: 'es2022',
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
        assetFileNames: (assetInfo) => {
          if ((assetInfo.names?.[0] ?? '').endsWith('.css')) return 'styles.css'
          return '[name][extname]'
        },
      },
    },
  },
})
