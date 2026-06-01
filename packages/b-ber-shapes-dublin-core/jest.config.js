module.exports = {
  name: 'b-ber-shapes-dublin-core',
  verbose: false,
  setupFilesAfterEnv: ['jest-extended'],
  testURL: 'http://localhost/',
  transform: { '^.+\\.[jt]sx?$': '@swc/jest' },
}
