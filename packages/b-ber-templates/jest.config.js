module.exports = {
  displayName: 'b-ber-templates',
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
  },
}
