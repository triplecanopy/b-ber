module.exports = {
  displayName: 'b-ber-tasks',
  verbose: false,
  setupFilesAfterEnv: ['jest-extended/all'],
  testEnvironmentOptions: { url: 'http://localhost/' },
  transform: { '^.+\\.[jt]sx?$': '@swc/jest' },
  moduleNameMapper: {
    '^@canopycanopycanopy/b-ber-lib/State$':
      '<rootDir>/__stubs__/b-ber-lib-State.js',
    '^@canopycanopycanopy/b-ber-lib/utils$':
      '<rootDir>/__stubs__/b-ber-lib-utils.js',
    '^@canopycanopycanopy/b-ber-lib/Html$':
      '<rootDir>/__stubs__/b-ber-lib-Html.js',
    '^@canopycanopycanopy/b-ber-lib/ManifestItemProperties$':
      '<rootDir>/__stubs__/b-ber-lib-ManifestItemProperties.js',
  },
}
