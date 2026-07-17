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
    '^.+\\.[jt]sx?$': [
      '@swc/jest',
      {
        jsc: {
          parser: { syntax: 'typescript', tsx: false, decorators: true },
          target: 'es2020',
        },
        module: { type: 'commonjs' },
      },
    ],
  },
}
