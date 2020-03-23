module.exports = {
  name: 'b-ber-grammar-audio-video',
  verbose: true,
  setupFilesAfterEnv: ['jest-extended'],
  testURL: 'http://localhost/',
  transform: { '^.+\\.jsx?$': './jest-transform-upward.js' },
}
