module.exports = {
  name: 'b-ber-reader-react',
  verbose: false,
  setupFilesAfterEnv: ['jest-extended'],
  testEnvironment: 'jest-environment-jsdom-global',
  testURL: 'http://localhost/',
  transform: { '^.+\\.jsx?$': './jest-transform-upward.js' },
}
