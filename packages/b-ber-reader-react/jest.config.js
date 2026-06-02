module.exports = {
  name: 'b-ber-reader-react',
  verbose: false,
  setupFiles: ['./jest.setup.js'],
  setupFilesAfterEnv: ['jest-extended/all'],
  testEnvironment: 'jest-environment-jsdom-global',
  testEnvironmentOptions: { url: 'http://localhost/' },
  testMatch: ['**/__tests__/**/*.test.{js,jsx}'],
  transform: { '^.+\\.jsx?$': './jest-transform-upward.js' },
}
