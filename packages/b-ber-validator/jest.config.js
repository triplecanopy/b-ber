module.exports = {
  name: 'b-ber-validator',
  verbose: true,
  setupFilesAfterEnv: ['jest-extended'],
  testPathIgnorePatterns: ['__mocks__'],
  testURL: 'http://localhost/',
  moduleNameMapper: {
    '@canopycanopycanopy/b-ber-shapes-directives':
      '<rootDir>/../b-ber-shapes-directives',
  },
  transform: {
    '^.+\\.jsx?$': './jest-transform-upward.js',
    '^.+\\.tsx?$': 'ts-jest',
  },
}
