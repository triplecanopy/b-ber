import { version as packageVersion } from '../../package.json'
import version from '../../src/lib/version'

test('exports the version declared in package.json', () => {
  // Asserting the shape alone is what let the module sit at a stale `3.0.7`
  // for three years while package.json moved on.
  expect(version).toBe(packageVersion)
})

test('package.json carries a semver-formatted version', () => {
  expect(packageVersion).toMatch(/^\d+\.\d+\.\d+$/)
})
