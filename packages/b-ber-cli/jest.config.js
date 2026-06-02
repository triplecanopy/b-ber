module.exports = {
  name: 'b-ber-cli',
  verbose: false,
  setupFiles: ['./jest.setup.js'],
  setupFilesAfterEnv: ['jest-extended/all'],
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
