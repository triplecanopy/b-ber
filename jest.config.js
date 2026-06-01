module.exports = {
  name: 'b-ber',
  verbose: false,
  setupFiles: ['./packages/b-ber-reader-react/jest.setup.js'],
  setupFilesAfterEnv: ['jest-extended'],
  collectCoverage: false,
  collectCoverageFrom: [
    '**/*.{js,jsx,ts,tsx}',
    '!**/node_modules/**',
    '!**/vendor/**',
    '!**/dist/**',
    '!**/demo/**',
    '!**/demos/**',
    '!**/*.config.js**',
    '!**/*.loaders.js**',
    '!**/b-ber-reader/epub/**/*.js',
    '!**/b-ber-resources/*.js',
    '!**/b-ber-templates/*.js',
    '!**/b-ber-templates/Ncx/*.js',
    '!**/b-ber-templates/Opf/*.js',
    '!**/b-ber-templates/Ops/*.js',
    '!**/b-ber-templates/Project/*.js',
    '!**/b-ber-templates/Toc/*.js',
    '!**/b-ber-templates/Xhtml/*.js',
    '!**/b-ber-templates/Xml/*.js',
    '!**/b-ber-templates/figures/*.js',
    '!**/b-ber-markdown-renderer/src/highlightjs/**/*.js',
    '!**/b-ber-reader/index.js',
    '!**/jest-transform-upward.js',
    '!**/webpack.config.*.js',
  ],
  coveragePathIgnorePatterns: [
    '<rootDir>/coverage/',
    '<rootDir>/demos/',
    '<rootDir>/scripts/',
  ],
  coverageReporters: ['html', 'lcov', 'json'],
  moduleFileExtensions: ['ts', 'js', 'jsx', 'json'],
  moduleNameMapper: {
    // b-ber-lib subpath imports (order matters: specific before catch-all)
    '^@canopycanopycanopy/b-ber-lib/Config$':
      '<rootDir>/packages/b-ber-lib/src/Config.ts',
    '^@canopycanopycanopy/b-ber-lib/EbookConvert$':
      '<rootDir>/packages/b-ber-lib/src/EbookConvert.ts',
    '^@canopycanopycanopy/b-ber-lib/Html$':
      '<rootDir>/packages/b-ber-lib/src/Html.ts',
    '^@canopycanopycanopy/b-ber-lib/HtmlToXml$':
      '<rootDir>/packages/b-ber-lib/src/HtmlToXml.ts',
    '^@canopycanopycanopy/b-ber-lib/ManifestItemProperties$':
      '<rootDir>/packages/b-ber-lib/src/ManifestItemProperties.ts',
    '^@canopycanopycanopy/b-ber-lib/State$':
      '<rootDir>/packages/b-ber-lib/src/State.ts',
    '^@canopycanopycanopy/b-ber-lib/Theme$':
      '<rootDir>/packages/b-ber-lib/src/Theme.ts',
    '^@canopycanopycanopy/b-ber-lib/utils$':
      '<rootDir>/packages/b-ber-lib/src/utils/index.ts',
    '^@canopycanopycanopy/b-ber-lib/YamlAdaptor$':
      '<rootDir>/packages/b-ber-lib/src/YamlAdaptor.ts',
    '^@canopycanopycanopy/b-ber-lib(.*)$':
      '<rootDir>/packages/b-ber-lib/src/index.ts',
    // Other TS-migrated packages — bypass stale dist/ artifacts
    '^@canopycanopycanopy/b-ber-logger$':
      '<rootDir>/packages/b-ber-logger/src/index.ts',
    '^@canopycanopycanopy/b-ber-shapes-directives$':
      '<rootDir>/packages/b-ber-shapes-directives/src/index.ts',
    '^@canopycanopycanopy/b-ber-shapes-dublin-core$':
      '<rootDir>/packages/b-ber-shapes-dublin-core/src/index.ts',
    '^@canopycanopycanopy/b-ber-shapes-sequences$':
      '<rootDir>/packages/b-ber-shapes-sequences/src/index.ts',
    // Grammar packages
    '^@canopycanopycanopy/b-ber-grammar-attributes$':
      '<rootDir>/packages/b-ber-grammar-attributes/src/index.ts',
    '^@canopycanopycanopy/b-ber-grammar-audio-video$':
      '<rootDir>/packages/b-ber-grammar-audio-video/src/index.ts',
    '^@canopycanopycanopy/b-ber-grammar-dialogue$':
      '<rootDir>/packages/b-ber-grammar-dialogue/src/index.ts',
    '^@canopycanopycanopy/b-ber-grammar-epigraph$':
      '<rootDir>/packages/b-ber-grammar-epigraph/src/index.ts',
    '^@canopycanopycanopy/b-ber-grammar-footnotes$':
      '<rootDir>/packages/b-ber-grammar-footnotes/src/index.ts',
    '^@canopycanopycanopy/b-ber-grammar-frontmatter$':
      '<rootDir>/packages/b-ber-grammar-frontmatter/src/index.ts',
    '^@canopycanopycanopy/b-ber-grammar-gallery$':
      '<rootDir>/packages/b-ber-grammar-gallery/src/index.ts',
    '^@canopycanopycanopy/b-ber-grammar-iframe$':
      '<rootDir>/packages/b-ber-grammar-iframe/src/index.ts',
    '^@canopycanopycanopy/b-ber-grammar-image$':
      '<rootDir>/packages/b-ber-grammar-image/src/index.ts',
    '^@canopycanopycanopy/b-ber-grammar-logo$':
      '<rootDir>/packages/b-ber-grammar-logo/src/index.ts',
    '^@canopycanopycanopy/b-ber-grammar-media$':
      '<rootDir>/packages/b-ber-grammar-media/src/index.ts',
    '^@canopycanopycanopy/b-ber-grammar-pullquote$':
      '<rootDir>/packages/b-ber-grammar-pullquote/src/index.ts',
    '^@canopycanopycanopy/b-ber-grammar-renderer$':
      '<rootDir>/packages/b-ber-grammar-renderer/src/index.ts',
    '^@canopycanopycanopy/b-ber-grammar-section$':
      '<rootDir>/packages/b-ber-grammar-section/src/index.ts',
    '^@canopycanopycanopy/b-ber-grammar-spread$':
      '<rootDir>/packages/b-ber-grammar-spread/src/index.ts',
    '^@canopycanopycanopy/b-ber-grammar-vimeo$':
      '<rootDir>/packages/b-ber-grammar-vimeo/src/index.ts',
    // Templates package and its subpath imports (used by b-ber-tasks)
    '^@canopycanopycanopy/b-ber-templates/(.+)$':
      '<rootDir>/packages/b-ber-templates/src/$1',
    '^@canopycanopycanopy/b-ber-templates$':
      '<rootDir>/packages/b-ber-templates/src/index.ts',
    // Parser packages
    '^@canopycanopycanopy/b-ber-parser-dialogue$':
      '<rootDir>/packages/b-ber-parser-dialogue/src/index.ts',
    '^@canopycanopycanopy/b-ber-parser-figure$':
      '<rootDir>/packages/b-ber-parser-figure/src/index.ts',
    '^@canopycanopycanopy/b-ber-parser-footnotes$':
      '<rootDir>/packages/b-ber-parser-footnotes/src/index.ts',
    '^@canopycanopycanopy/b-ber-parser-gallery$':
      '<rootDir>/packages/b-ber-parser-gallery/src/index.ts',
    '^@canopycanopycanopy/b-ber-parser-section$':
      '<rootDir>/packages/b-ber-parser-section/src/index.ts',
  },
  testEnvironment: 'jest-environment-jsdom-global',
  testMatch: [
    '**/__tests__/**/*.test.{js,jsx,ts,tsx}',
    '**/__tests__/index.{js,ts}',
  ],
  testPathIgnorePatterns: ['__mocks__'],
  testURL: 'http://localhost/',
  transform: {
    '^.+\\.[jt]sx?$': '@swc/jest',
  },
}
