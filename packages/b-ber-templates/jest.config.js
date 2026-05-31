module.exports = {
  name: 'b-ber-templates',
  verbose: false,
  setupFilesAfterEnv: ['jest-extended'],
  testURL: 'http://localhost/',
  transform: { '^.+\\.jsx?$': './jest-transform-upward.js' },
  collectCoverageFrom: ['src/**/*.js'],
}
