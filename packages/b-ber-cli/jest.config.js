module.exports = {
  displayName: 'b-ber-cli',
  verbose: false,
  setupFiles: ['./jest.setup.js'],
  setupFilesAfterEnv: ['jest-extended/all'],
  // Matches the root config, so __tests__/helpers/ is not run as a suite.
  testMatch: ['**/__tests__/**/*.test.{js,ts}'],
  testEnvironmentOptions: { url: 'http://localhost/' },
  transform: { '^.+\\.[jt]sx?$': '@swc/jest' },
  moduleNameMapper: {
    '^@canopycanopycanopy/b-ber-lib/State$':
      '<rootDir>/__stubs__/b-ber-lib-State.js',
    '^@canopycanopycanopy/b-ber-lib/utils$':
      '<rootDir>/__stubs__/b-ber-lib-utils.js',
    '^@canopycanopycanopy/b-ber-lib/Theme$':
      '<rootDir>/__stubs__/b-ber-lib-Theme.js',
    '^@canopycanopycanopy/b-ber-lib/YamlAdaptor$':
      '<rootDir>/__stubs__/b-ber-lib-YamlAdaptor.js',
  },
}
