import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: ['src/index.ts', 'src/directives/index.ts', 'src/parse.ts'],
  format: ['cjs'],
  dts: true,
  clean: true,
  fixedExtension: false,
  tsconfig: './tsconfig.build.json',
})
