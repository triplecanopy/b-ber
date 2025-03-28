import Url from '../../src/helpers/Url'

describe('Url', () => {
  test('creates a slug', () => {
    const input = 'abc #!$   éß1'
    const output = 'abc-1'
    expect(Url.slug(input)).toBe(output)
  })

  test('builds a query string', () => {
    const input = { foo: 'one', bar: 1.1, baz: [1, true, 'qux zop'], bat: null }
    const output =
      'foo=one&bar=1.1&baz=%5B1%2Ctrue%2C%22qux%20zop%22%5D&bat=null'
    expect(Url.buildQueryString(input)).toBe(output)
  })

  test('ensures a url has been decoded', () => {
    const input = 'http://foo%2520bar%252520baz.com'
    const output = 'http://foo bar baz.com'
    expect(Url.ensureDecodedURL(input)).toBe(output)
  })

  test('trims slashes', () => {
    expect(Url.trimSlashes('/foo')).toBe('foo')
    expect(Url.trimSlashes('/foo/')).toBe('foo')
    expect(Url.trimSlashes('////foo')).toBe('foo')
    expect(Url.trimSlashes('////foo//')).toBe('foo')
  })

  test('resolves a relative url', () => {
    expect(Url.resolveRelativeURL('http://example.com', 'foo/bar')).toBe(
      'http://example.com/foo/bar'
    )
    expect(Url.resolveRelativeURL('http://example.com', '//foo')).toBe(
      'http://example.com/foo'
    )
    expect(Url.resolveRelativeURL('http://example.com/', 'foo/')).toBe(
      'http://example.com/foo'
    )
    expect(Url.resolveRelativeURL('http://example.com/foo/bar', '../')).toBe(
      'http://example.com/foo/'
    )
    expect(
      Url.resolveRelativeURL('http://example.com/foo/bar', '../../baz')
    ).toBe('http://example.com/baz')
    expect(
      Url.resolveRelativeURL('http://example.com/', 'foo/?bar=some val')
    ).toBe('http://example.com/foo/?bar=some%20val')
  })

  test('resolves overlapping urls', () => {
    expect(Url.resolveOverlappingURL('http://example.com/foo', 'foo/bar')).toBe(
      'http://example.com/foo/bar'
    )
    expect(
      Url.resolveOverlappingURL('http://example.com/foo/bar/baz', '/bar/baz')
    ).toBe('http://example.com/foo/bar/baz')
  })

  test('tests if a url is relative', () => {
    expect(Url.isRelative('http://example.com/test.jpg')).toBe(false)
    expect(Url.isRelative('../test.jpg')).toBe(true)
    expect(Url.isRelative('test.jpg')).toBe(true)
    expect(Url.isRelative('../../../test.jpg')).toBe(true)
  })

  test('trims a filename from a url', () => {
    expect(Url.trimFilenameFromResponse('http://example.com/test.jpg')).toBe(
      'http://example.com'
    )
    expect(
      Url.trimFilenameFromResponse('http://example.com/path/to/file/test.jpg')
    ).toBe('http://example.com/path/to/file')
  })

  test('creates an absolute url', () => {
    expect(
      Url.toAbsoluteUrl('http://example.com/', 'path/to/file/test.jpg')
    ).toBe('http://example.com/path/to/file/test.jpg')
    expect(
      Url.toAbsoluteUrl('http://example.com', 'path/to/file/test.jpg')
    ).toBe('http://example.com/path/to/file/test.jpg')
    expect(
      Url.toAbsoluteUrl('http://example.com/', '/path/to/file/test.jpg')
    ).toBe('http://example.com/path/to/file/test.jpg')
  })

  test('tests if an url is external', () => {
    expect(Url.isExternal('/foo/bar.jpg', '')).toBeFalse()
    expect(
      Url.isExternal('http://example.com/foo', 'http://example.com/')
    ).toBeFalse()
    expect(Url.isExternal()).toBeFalse()
    expect(
      Url.isExternal('http://example.com#anchor', 'http://example.com')
    ).toBeFalse()
    expect(Url.isExternal('http://localhost/', 'http://example.com')).toBeTrue()
    expect(
      Url.isExternal('http://localhost#anchor', 'http://example.com')
    ).toBeTrue()
  })
})
