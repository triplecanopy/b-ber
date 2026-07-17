import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: [
    'src/index.ts',
    'src/figures/index.ts',
    'src/Ncx/index.ts',
    'src/Opf/Guide.ts',
    'src/Opf/Manifest.ts',
    'src/Opf/Metadata.ts',
    'src/Opf/Pkg.ts',
    'src/Opf/Spine.ts',
    'src/Project/index.ts',
    'src/Toc/index.ts',
    'src/Xhtml/index.ts',
    'src/Xml/index.ts',
  ],
  format: ['cjs'],
  dts: true,
  clean: true,
  fixedExtension: false,
  tsconfig: './tsconfig.build.json',
})
