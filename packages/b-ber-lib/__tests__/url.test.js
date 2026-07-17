import Url from '../src/Url'

describe('Url.trimSlashes', () => {
  it('removes a leading slash', () => {
    expect(Url.trimSlashes('/foo')).toBe('foo')
  })

  it('removes multiple leading slashes', () => {
    expect(Url.trimSlashes('//foo')).toBe('foo')
  })

  it('removes a trailing slash when there is no leading slash', () => {
    expect(Url.trimSlashes('foo/')).toBe('foo')
  })

  // regex has no /g flag: first match wins, so leading takes precedence
  it('removes only the leading slash when both are present', () => {
    expect(Url.trimSlashes('/foo/')).toBe('foo/')
  })

  it('leaves strings without slashes unchanged', () => {
    expect(Url.trimSlashes('foo')).toBe('foo')
  })
})

describe('Url.removeTrailingSlash', () => {
  it('removes a trailing slash', () => {
    expect(Url.removeTrailingSlash('foo/')).toBe('foo')
  })

  it('removes multiple trailing slashes', () => {
    expect(Url.removeTrailingSlash('foo///')).toBe('foo')
  })

  it('leaves strings without trailing slash unchanged', () => {
    expect(Url.removeTrailingSlash('foo')).toBe('foo')
  })

  it('returns empty string for non-string input', () => {
    expect(Url.removeTrailingSlash(null)).toBe('')
    expect(Url.removeTrailingSlash(42)).toBe('')
  })
})

describe('Url.addTrailingSlash', () => {
  it('adds a trailing slash', () => {
    expect(Url.addTrailingSlash('foo')).toBe('foo/')
  })

  it('does not double a trailing slash', () => {
    expect(Url.addTrailingSlash('foo/')).toBe('foo/')
  })

  it('returns "/" when input is "/"', () => {
    expect(Url.addTrailingSlash('/')).toBe('/')
  })

  it('returns "/" for non-string input', () => {
    expect(Url.addTrailingSlash(null)).toBe('/')
    expect(Url.addTrailingSlash(42)).toBe('/')
  })
})

describe('Url.ensureDecoded', () => {
  it('decodes a percent-encoded string', () => {
    expect(Url.ensureDecoded('hello%20world')).toBe('hello world')
  })

  it('repeatedly decodes until fully decoded', () => {
    expect(Url.ensureDecoded('hello%2520world')).toBe('hello world')
  })

  it('returns an already-decoded string unchanged', () => {
    expect(Url.ensureDecoded('hello world')).toBe('hello world')
  })
})

describe('Url.encodeQueryString', () => {
  it('returns the path unchanged when there is no query string', () => {
    expect(Url.encodeQueryString('http://example.com/path')).toBe(
      'http://example.com/path'
    )
  })

  it('encodes the query string portion', () => {
    const result = Url.encodeQueryString('http://example.com/path?key=value')
    expect(result).toBe('http://example.com/path?key%3Dvalue')
  })

  it('decodes before encoding to avoid double-encoding', () => {
    // %3D is already-encoded '='; after decode→encode it stays as %3D
    const result = Url.encodeQueryString('http://example.com/path?key%3Dvalue')
    expect(result).toBe('http://example.com/path?key%3Dvalue')
  })
})
