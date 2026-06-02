module.exports = {
  name: 'b-ber-reader',
  verbose: false,
  setupFilesAfterEnv: ['jest-extended/all'],
  testEnvironment: 'jest-environment-jsdom-global',
  testEnvironmentOptions: { url: 'http://localhost/' },
  transform: { '^.+\\.jsx?$': './jest-transform-upward.js' },
}
