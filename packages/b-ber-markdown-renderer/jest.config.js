module.exports = {
  displayName: 'b-ber-markdown-renderer',
  verbose: false,
  setupFilesAfterEnv: ['jest-extended/all'],
  testEnvironmentOptions: { url: 'http://localhost/' },
  transform: { '^.+\\.[jt]sx?$': '@swc/jest' },
  moduleNameMapper: {
    '^@canopycanopycanopy/b-ber-lib/Config$':
      '<rootDir>/../b-ber-lib/src/Config.ts',
    '^@canopycanopycanopy/b-ber-lib/State$':
      '<rootDir>/../b-ber-lib/src/State.ts',
    '^@canopycanopycanopy/b-ber-lib/YamlAdaptor$':
      '<rootDir>/../b-ber-lib/src/YamlAdaptor.ts',
    '^@canopycanopycanopy/b-ber-lib/ManifestItemProperties$':
      '<rootDir>/../b-ber-lib/src/ManifestItemProperties.ts',
    '^@canopycanopycanopy/b-ber-lib/utils$':
      '<rootDir>/../b-ber-lib/src/utils/index.ts',
    '^@canopycanopycanopy/b-ber-lib(.*)$':
      '<rootDir>/../b-ber-lib/src/index.ts',
    '^@canopycanopycanopy/b-ber-logger$':
      '<rootDir>/../b-ber-logger/src/index.ts',
    '^@canopycanopycanopy/b-ber-shapes-directives$':
      '<rootDir>/../b-ber-shapes-directives/src/index.ts',
    '^@canopycanopycanopy/b-ber-grammar-audio-video$':
      '<rootDir>/../b-ber-grammar-audio-video/src/index.ts',
    '^@canopycanopycanopy/b-ber-grammar-dialogue$':
      '<rootDir>/../b-ber-grammar-dialogue/src/index.ts',
    '^@canopycanopycanopy/b-ber-grammar-footnotes$':
      '<rootDir>/../b-ber-grammar-footnotes/src/index.ts',
    '^@canopycanopycanopy/b-ber-grammar-frontmatter$':
      '<rootDir>/../b-ber-grammar-frontmatter/src/index.ts',
    '^@canopycanopycanopy/b-ber-grammar-gallery$':
      '<rootDir>/../b-ber-grammar-gallery/src/index.ts',
    '^@canopycanopycanopy/b-ber-grammar-iframe$':
      '<rootDir>/../b-ber-grammar-iframe/src/index.ts',
    '^@canopycanopycanopy/b-ber-grammar-image$':
      '<rootDir>/../b-ber-grammar-image/src/index.ts',
    '^@canopycanopycanopy/b-ber-grammar-logo$':
      '<rootDir>/../b-ber-grammar-logo/src/index.ts',
    '^@canopycanopycanopy/b-ber-grammar-media$':
      '<rootDir>/../b-ber-grammar-media/src/index.ts',
    '^@canopycanopycanopy/b-ber-grammar-pullquote$':
      '<rootDir>/../b-ber-grammar-pullquote/src/index.ts',
    '^@canopycanopycanopy/b-ber-grammar-section$':
      '<rootDir>/../b-ber-grammar-section/src/index.ts',
    '^@canopycanopycanopy/b-ber-grammar-spread$':
      '<rootDir>/../b-ber-grammar-spread/src/index.ts',
    '^@canopycanopycanopy/b-ber-grammar-vimeo$':
      '<rootDir>/../b-ber-grammar-vimeo/src/index.ts',
    '^@canopycanopycanopy/b-ber-parser-footnotes$':
      '<rootDir>/../b-ber-parser-footnotes/src/index.ts',
    '^@canopycanopycanopy/b-ber-parser-gallery$':
      '<rootDir>/../b-ber-parser-gallery/src/index.ts',
  },
}
