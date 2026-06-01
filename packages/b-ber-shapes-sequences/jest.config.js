module.exports = {
  name: 'b-ber-shapes-sequences',
  verbose: false,
  setupFilesAfterEnv: ['jest-extended'],
  testURL: 'http://localhost/',
  transform: { '^.+\\.[jt]sx?$': '@swc/jest' },
}
