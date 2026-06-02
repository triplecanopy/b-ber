module.exports = {
  name: 'b-ber-shapes-directives',
  verbose: false,
  setupFilesAfterEnv: ['jest-extended/all'],
  testEnvironmentOptions: { url: 'http://localhost/' },
  transform: { '^.+\\.[jt]sx?$': '@swc/jest' },
}
