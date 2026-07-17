test('loads without throwing', () => {
  expect(() => {
    require('../../src/lib/polyfills')
  }).not.toThrow()
})
