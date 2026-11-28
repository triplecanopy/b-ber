import log from '@canopycanopycanopy/b-ber-logger'

import {
  attributes,
  attributesObject,
  attributesQueryString,
  attributesString,
  htmlId,
  parseAttrs,
  toAlias,
} from '../src'

jest.mock('@canopycanopycanopy/b-ber-logger', () => ({
  // Returns an Error, as the real log.error does, so that a site's
  // `throw log.error(...)` throws one rather than undefined
  error: jest.fn((err) =>
    err instanceof Error ? err : new Error(String(err))
  ),
  warn: jest.fn(),
  info: jest.fn(),
}))

afterEach(() => {
  jest.clearAllMocks()
})

describe('b-ber-grammar-attributes', () => {
  it('gets the file name from a path', () => {
    const fileName = 'foo'
    const filePath = `/path/to/${fileName}.mp3`
    expect(toAlias(filePath)).toEqual(fileName)
  })

  it('removes unsupported characters for an HTML id attribute', () => {
    expect(htmlId(' foo ')).toEqual('-foo-')
    expect(htmlId('123')).toEqual('123')
    expect(htmlId('1x _')).toEqual('1x-_')
  })

  it('converts a directive string to an object literal', () => {
    let input = 'foo:bar'
    let output = { foo: 'bar' }

    expect(parseAttrs(input)).toEqual(output)

    input = 'foo:bar baz:bat'
    output = { foo: 'bar', baz: 'bat' }

    expect(parseAttrs(input)).toEqual(output)

    input = 'foo:bar baz:bat qux:"supports spaces"'
    output = { foo: 'bar', baz: 'bat', qux: 'supports spaces' }

    expect(parseAttrs(input)).toEqual(output)

    input =
      '   foo:"with leading and trailing spaces"      bar:\'supports quotes\''
    output = { foo: 'with leading and trailing spaces', bar: 'supports quotes' }

    expect(parseAttrs(input)).toEqual(output)
  })

  it('converts a directive string to an object literal with valid keys', () => {
    const obj = attributesObject('classes:foo', 'chapter')
    expect(obj).toEqual({ classes: 'foo  chapter', epubTypes: ' chapter' })
  })

  it('validates an attributes object', () => {
    // A draft directive is not one of ALL_DIRECTIVES, so it fails before the
    // draft substitution below it is reached
    expect(() => attributesObject('classes:foo', 'abstract')).toThrow(
      'Invalid directive: [abstract]'
    )

    expect(attributesObject('classes:foo', 'subchapter')).toEqual({
      classes: 'foo subchapter  chapter',
      epubTypes: ' chapter',
    })

    expect(attributesObject('bogus:foo', 'chapter')).toEqual({
      classes: 'bodymatter chapter',
      epubTypes: 'bodymatter chapter',
    })

    expect(attributesObject('', 'chapter')).toEqual({
      classes: 'bodymatter chapter',
      epubTypes: 'bodymatter chapter',
    })
  })

  // pullquote is in both the draft and the misc sets. It used to be
  // draft-substituted with `chapter`, whose attributes do not include
  // `citation`, so its citation was dropped (TASK-161)
  it('keeps pullquote as a misc block, with its citation', () => {
    const spyWarn = jest.spyOn(log, 'warn')

    expect(attributesObject('citation:"Jane Doe"', 'pullquote')).toEqual({
      citation: 'Jane Doe',
      classes: ' pullquote',
    })
    expect(spyWarn).not.toHaveBeenCalled()

    // credits and seriespage are still draft-substituted
    expect(attributesObject('', 'credits')).toEqual({
      classes: 'credits backmatter chapter',
      epubTypes: 'backmatter chapter',
    })
  })

  it('logs errors on invalid attributes object', () => {
    const spyError = jest.spyOn(log, 'error')
    const spyWarn = jest.spyOn(log, 'warn')

    // Each stops at its first error
    expect(() => attributesObject('classes:foo', null)).toThrow(
      'No directive provided'
    )
    expect(() => attributesObject('classes:foo', 'bogus')).toThrow(
      'Invalid directive: [bogus]'
    )

    expect(spyError).toHaveBeenCalledTimes(2)
    expect(spyWarn).not.toHaveBeenCalled()
  })

  it('converts an object literal to HTML attribtues', () => {
    expect(attributesString({ classes: 'foo' })).toEqual(' class="foo"')

    expect(
      attributesString({ classes: 'foo', autoplay: 'yes', controls: 'yes' })
    ).toEqual(' class="foo" autoplay="autoplay" controls="controls"')

    expect(
      attributesString({
        classes: 'foo',
        epubTypes: 'chapter',
        attrs: 'bogus',
        source: 'foo.jpg',
        controls: 'no',
        playsinline: 'playsinline',
      })
    ).toEqual(
      ' class="foo" epub:type="chapter" src="foo.jpg" playsinline="playsinline"'
    )
  })

  it('creates a query string from an attributes object', () => {
    expect(attributesQueryString({ foo: 1, bar: 2 })).toEqual(
      '?foo=1&amp;bar=2'
    )

    expect(attributesQueryString({ foo: 1, bar: '&2' })).toEqual(
      '?foo=1&amp;bar=%262'
    )
  })

  it('creates an HTML attributes string from a directive attributes object', () => {
    expect(attributes('classes:foo', 'chapter')).toEqual(
      ' class="foo  chapter" epub:type=" chapter"'
    )
  })
})
