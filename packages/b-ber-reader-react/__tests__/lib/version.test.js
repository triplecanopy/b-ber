import version from '../../src/lib/version'

test('exports a semver-formatted version string', () => {
  expect(version).toMatch(/^\d+\.\d+\.\d+$/)
})
