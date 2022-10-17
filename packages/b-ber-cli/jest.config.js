module.exports = {
  name: 'b-ber-cli',
  verbose: false,
  setupFilesAfterEnv: ['jest-extended'],
  testURL: 'http://localhost/',
  transform: { '^.+\\.jsx?$': './jest-transform-upward.js' },
}
