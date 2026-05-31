import vimeo from '../src'

jest.mock('@canopycanopycanopy/b-ber-lib/State', () => ({
  build: 'epub',
  figures: [],
  add: jest.fn(),
  src: {
    images: p => p,
  },
}))

jest.mock('@canopycanopycanopy/b-ber-logger', () => ({
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
}))

jest.mock('@canopycanopycanopy/b-ber-grammar-attributes', () => ({
  attributesQueryString: jest.fn(() => ''),
  attributesString: jest.fn(() => ''),
  attributesObject: jest.fn(() => ({ source: '12345' })),
  htmlId: jest.fn(id => id),
}))

jest.mock('@canopycanopycanopy/b-ber-lib', () => ({
  Html: { comment: jest.fn(s => s) },
}))

const instance = { renderInline: jest.fn(str => str) }
const context = { fileName: 'test' }

describe('b-ber-grammar-vimeo', () => {
  it('exports plugin, name, and renderer', () => {
    expect(vimeo.plugin).toBeFunction()
    expect(vimeo.name).toBe('vimeo')
    expect(vimeo.renderer).toBeFunction()
  })

  it('renderer returns a config object', () => {
    const config = vimeo.renderer({ instance, context })
    expect(config.marker).toBeDefined()
    expect(config.minMarkers).toBeNumber()
    expect(config.validate).toBeFunction()
    expect(config.render).toBeFunction()
  })

  it('validate returns truthy for vimeo directive', () => {
    const config = vimeo.renderer({ instance, context })
    expect(config.validate('vimeo:foo')).toBeTruthy()
  })

  it('validate returns falsy for figure directive', () => {
    const config = vimeo.renderer({ instance, context })
    expect(config.validate('figure:foo')).toBeFalsy()
  })

  it('validate returns falsy for iframe directive', () => {
    const config = vimeo.renderer({ instance, context })
    expect(config.validate('iframe:foo')).toBeFalsy()
  })

  it('render returns empty string when token info does not match DIRECTIVE_RE', () => {
    const config = vimeo.renderer({ instance, context })
    const tokens = [{ info: 'not-matching', map: [0, 1], children: null }]
    expect(config.render(tokens, 0)).toBe('')
  })

  it('validate returns truthy for vimeo-inline directive', () => {
    const config = vimeo.renderer({ instance, context })
    expect(config.validate('vimeo-inline:bar')).toBeTruthy()
  })

  it('render calls prepare and dispatches to createVimeo for vimeo type', () => {
    const config = vimeo.renderer({ instance, context })
    const tokens = [
      { info: 'vimeo:my-id source="12345"', map: [0, 1], children: null },
    ]
    const result = config.render(tokens, 0)
    expect(typeof result).toBe('string')
    expect(result.length).toBeGreaterThan(0)
  })

  it('render returns HTML containing figure id for vimeo type', () => {
    const config = vimeo.renderer({ instance, context })
    const tokens = [
      { info: 'vimeo:my-id source="12345"', map: [0, 1], children: null },
    ]
    const result = config.render(tokens, 0)
    expect(result).toContain('refmy-id')
  })

  it('render dispatches to createUnsupportedInline for vimeo-inline on non-reader build', () => {
    const config = vimeo.renderer({ instance, context })
    const tokens = [
      {
        info: 'vimeo-inline:my-id source="12345"',
        map: [0, 1],
        children: null,
      },
    ]
    const result = config.render(tokens, 0)
    expect(typeof result).toBe('string')
    expect(result).toContain('media__fallback')
  })

  it('render handles token with null map (lineNumber becomes null)', () => {
    const config = vimeo.renderer({ instance, context })
    const tokens = [
      { info: 'vimeo:no-map source="12345"', map: null, children: null },
    ]
    expect(() => config.render(tokens, 0)).not.toThrow()
  })

  it('render handles token with children (caption rendered via renderInline)', () => {
    const config = vimeo.renderer({ instance, context })
    const tokens = [
      {
        info: 'vimeo:cap-id source="12345"',
        map: [0, 1],
        children: 'caption text',
      },
    ]
    const result = config.render(tokens, 0)
    expect(typeof result).toBe('string')
    expect(instance.renderInline).toHaveBeenCalledWith('caption text')
  })
})
