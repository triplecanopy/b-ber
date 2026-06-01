module.exports = {
  name: 'b-ber-lib',
  verbose: false,
  setupFilesAfterEnv: ['jest-extended'],
  testURL: 'http://localhost/',
  transform: { '^.+\\.[jt]sx?$': '@swc/jest' },
}
