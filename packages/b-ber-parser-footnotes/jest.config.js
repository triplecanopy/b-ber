module.exports = {
  name: 'b-ber-parser-footnotes',
  verbose: false,
  setupFilesAfterEnv: ['jest-extended'],
  testURL: 'http://localhost/',
  transform: { '^.+\\.jsx?$': './jest-transform-upward.js' },
  moduleNameMapper: {
    '^@canopycanopycanopy/b-ber-lib/(.*)$': '<rootDir>/../b-ber-lib/$1',
    '^@canopycanopycanopy/b-ber-logger$':
      '<rootDir>/../b-ber-logger/src/index.js',
  },
}
