module.exports = {
  name: 'b-ber-grammar-iframe',
  verbose: false,
  setupFilesAfterEnv: ['jest-extended'],
  testURL: 'http://localhost/',
  transform: { '^.+\\.[jt]sx?$': '@swc/jest' },
  moduleNameMapper: {
    '^@canopycanopycanopy/b-ber-lib/State$':
      '<rootDir>/../b-ber-lib/src/State.ts',
    '^@canopycanopycanopy/b-ber-lib/YamlAdaptor$':
      '<rootDir>/../b-ber-lib/src/YamlAdaptor.ts',
    '^@canopycanopycanopy/b-ber-lib/utils$':
      '<rootDir>/../b-ber-lib/src/utils/index.ts',
    '^@canopycanopycanopy/b-ber-lib(.*)$':
      '<rootDir>/../b-ber-lib/src/index.ts',
    '^@canopycanopycanopy/b-ber-logger$':
      '<rootDir>/../b-ber-logger/src/index.ts',
    '^@canopycanopycanopy/b-ber-shapes-directives$':
      '<rootDir>/../b-ber-shapes-directives/src/index.ts',
    '^@canopycanopycanopy/b-ber-grammar-attributes$':
      '<rootDir>/../b-ber-grammar-attributes/src/index.ts',
    '^@canopycanopycanopy/b-ber-grammar-renderer$':
      '<rootDir>/../b-ber-grammar-renderer/src/index.ts',
    '^@canopycanopycanopy/b-ber-grammar-section$':
      '<rootDir>/../b-ber-grammar-section/src/index.ts',
    '^@canopycanopycanopy/b-ber-parser-section$':
      '<rootDir>/../b-ber-parser-section/src/index.ts',
    '^@canopycanopycanopy/b-ber-parser-dialogue$':
      '<rootDir>/../b-ber-parser-dialogue/src/index.ts',
    '^@canopycanopycanopy/b-ber-parser-figure$':
      '<rootDir>/../b-ber-parser-figure/src/index.ts',
    '^@canopycanopycanopy/b-ber-parser-gallery$':
      '<rootDir>/../b-ber-parser-gallery/src/index.ts',
  },
}
