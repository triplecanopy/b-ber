module.exports = {
    name: 'b-ber-lib',

    verbose: false,
  setupFilesAfterEnv: ['jest-extended'],
    testURL: 'http://localhost/',
    transform: { '^.+\\.jsx?$': './jest-transform-upward.js' },
}
