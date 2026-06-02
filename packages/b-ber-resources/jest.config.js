module.exports = {
  name: 'b-ber-resources',
  verbose: false,
  setupFilesAfterEnv: ['jest-extended/all'],
  testEnvironmentOptions: { url: 'http://localhost/' },
  transform: { '^.+\\.jsx?$': './jest-transform-upward.js' },
}
