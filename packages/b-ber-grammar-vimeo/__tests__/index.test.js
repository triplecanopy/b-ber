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
})
