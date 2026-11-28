// The parse is b-ber-markdown-renderer's built `/parse` entry, which
// b-ber-validator depends on as it is published: the tests run against what
// `bber check` runs. Build it first (`npm run build` does, in order)
module.exports = {
  displayName: 'b-ber-validator',
  verbose: false,
  setupFilesAfterEnv: ['jest-extended/all'],
  testPathIgnorePatterns: ['__mocks__'],
  testEnvironmentOptions: { url: 'http://localhost/' },
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
