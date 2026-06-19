module.exports = {
  displayName: 'b-ber-reader-react',
  verbose: false,
  setupFiles: ['./jest.setup.js'],
  setupFilesAfterEnv: ['jest-extended/all'],
  testEnvironment: 'jest-environment-jsdom-global',
  testEnvironmentOptions: { url: 'http://localhost/' },
  testMatch: ['**/__tests__/**/*.test.{js,jsx}'],
  moduleNameMapper: {
    // CSS Modules resolve to a class-name map; side-effect stylesheets resolve
    // to nothing. The `.module.` rule must precede the catch-all `.css|.scss`.
    '\\.module\\.(css|scss)$': '<rootDir>/__tests__/helpers/cssModuleProxy.js',
    '\\.(css|scss)$': '<rootDir>/__tests__/helpers/styleStub.js',
  },
  transform: {
    '^.+\\.[jt]sx?$': [
      '@swc/jest',
      {
        jsc: {
          parser: { syntax: 'typescript', tsx: true, decorators: true },
          target: 'es2020',
          transform: { legacyDecorator: true, decoratorMetadata: true },
        },
        module: { type: 'commonjs' },
      },
    ],
  },
}
