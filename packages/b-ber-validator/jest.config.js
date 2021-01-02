module.exports = {
  name: 'b-ber-validator',
  verbose: true,
  setupFilesAfterEnv: ['jest-extended'],
  testPathIgnorePatterns: ['__mocks__'],
  testURL: 'http://localhost/',
  transform: {
    '^.+\\.jsx?$': './jest-transform-upward.js',
    '^.+\\.tsx?$': 'ts-jest',
  },
}
