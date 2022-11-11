import log from '@canopycanopycanopy/b-ber-logger'

import {
  attributes,
  attributesObject,
  attributesString,
  attributesQueryString,
  htmlId,
  parseAttrs,
  toAlias,
} from '../src'

jest.mock('@canopycanopycanopy/b-ber-logger', () => ({
  error: jest.fn(),
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
    expect(attributesObject('classes:foo', 'abstract')).toEqual({
      classes: 'foo abstract  chapter',
      epubTypes: ' chapter',
    })

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

  it('logs errors on invalid attributes object', () => {
    const spyError = jest.spyOn(log, 'error')
    const spyWarn = jest.spyOn(log, 'warn')

    // This logs 2 errors since the test suite doesn't bail after it encounters
    // the first error
    expect(() => attributesObject('classes:foo', null)).toThrow()
    expect(() => attributesObject('classes:foo', 'bogus')).toThrow()

    expect(spyError).toHaveBeenCalledTimes(3)
    expect(spyWarn).toHaveBeenCalledTimes(2)
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
