import Ops from '../src/Ops'

describe('templates.Ops', () => {
  test('mimetype() returns the EPUB MIME type string', () => {
    expect(Ops.mimetype()).toBe('application/epub+zip')
  })
})
