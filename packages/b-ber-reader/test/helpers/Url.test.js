/* global test,expect */

import Url from '../../src/helpers/Url'


test('creates a slug', done => {
    const input = 'abc #!$   éß1'
    const output = 'abc-1'
    expect(Url.slug(input)).toBe(output)
    done()
})

test('builds a query string', done => {
    const input = {foo: "one", bar: 1.1, baz: [1, true, 'qux zop'], bat: null}
    const output = 'foo=one&bar=1.1&baz=%5B1%2Ctrue%2C%22qux%20zop%22%5D&bat=null'
    expect(Url.buildQueryString(input)).toBe(output)
    done()
})

test('ensures a url has been decoded', done => {
    const input = 'http://foo%2520bar%252520baz.com'
    const output = 'http://foo bar baz.com'
    expect(Url.ensureDecodedURL(input)).toBe(output)
    done()
})

test('trims slashes', done => {
    expect(Url.trimSlashes('/foo')).toBe('foo')
    expect(Url.trimSlashes('/foo/')).toBe('foo')
    expect(Url.trimSlashes('////foo')).toBe('foo')
    expect(Url.trimSlashes('////foo//')).toBe('foo')

    done()
})

test('resolves a relative url', done => {
    expect(Url.resolveRelativeURL(
        'http://example.com',
        'foo/bar'
    )).toBe('http://example.com/foo/bar')

    expect(Url.resolveRelativeURL(
        'http://example.com',
        '//foo'
    )).toBe('http://example.com/foo')

    expect(Url.resolveRelativeURL(
        'http://example.com/',
        'foo/'
    )).toBe('http://example.com/foo')

    expect(Url.resolveRelativeURL(
        'http://example.com/foo/bar',
        '../'
    )).toBe('http://example.com/foo/')

    expect(Url.resolveRelativeURL(
        'http://example.com/foo/bar',
        '../../baz'
    )).toBe('http://example.com/baz')

    expect(Url.resolveRelativeURL(
        'http://example.com/',
        'foo/?bar=some val'
    )).toBe('http://example.com/foo/?bar=some%20val')

    done()
})

test('resolves overlapping urls', done => {
    expect(Url.resolveOverlappingURL(
        'http://example.com/foo',
        'foo/bar'
    )).toBe('http://example.com/foo/bar')

    expect(Url.resolveOverlappingURL(
        'http://example.com/foo/bar/baz',
        '/bar/baz'
    )).toBe('http://example.com/foo/bar/baz')

    done()
})
