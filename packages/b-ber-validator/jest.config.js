module.exports = {
  displayName: 'b-ber-validator',
  verbose: false,
  setupFilesAfterEnv: ['jest-extended/all'],
  testPathIgnorePatterns: ['__mocks__'],
  testEnvironmentOptions: { url: 'http://localhost/' },
  moduleNameMapper: {
    '@canopycanopycanopy/b-ber-shapes-directives':
      '<rootDir>/../b-ber-shapes-directives',
  },
  transform: {
    '^.+\\.jsx?$': './jest-transform-upward.js',
    '^.+\\.tsx?$': 'ts-jest',
  },
}
