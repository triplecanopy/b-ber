module.exports = {
  name: 'b-ber-cli',
  verbose: false,
  setupFiles: ['./jest.setup.js'],
  setupFilesAfterEnv: ['jest-extended'],
  testURL: 'http://localhost/',
  transform: { '^.+\\.jsx?$': './jest-transform-upward.js' },
}
