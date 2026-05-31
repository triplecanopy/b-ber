import iframe from '../src'

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

jest.mock('fs-extra', () => ({ existsSync: jest.fn(() => true) }))

const instance = { renderInline: jest.fn(str => str) }
const context = { fileName: 'test' }

describe('b-ber-grammar-iframe', () => {
  it('exports plugin, name, and renderer', () => {
    expect(iframe.plugin).toBeFunction()
    expect(iframe.name).toBe('iframe')
    expect(iframe.renderer).toBeFunction()
  })

  it('renderer returns a config object', () => {
    const config = iframe.renderer({ instance, context })
    expect(config.marker).toBeDefined()
    expect(config.minMarkers).toBeNumber()
    expect(config.validate).toBeFunction()
    expect(config.render).toBeFunction()
  })

  it('validate returns truthy for iframe directive', () => {
    const config = iframe.renderer({ instance, context })
    expect(config.validate('iframe:foo')).toBeTruthy()
  })

  it('validate returns falsy for figure directive', () => {
    const config = iframe.renderer({ instance, context })
    expect(config.validate('figure:foo')).toBeFalsy()
  })

  it('validate returns falsy for vimeo directive', () => {
    const config = iframe.renderer({ instance, context })
    expect(config.validate('vimeo:foo')).toBeFalsy()
  })

  it('render returns empty string when token info does not match DIRECTIVE_RE', () => {
    const config = iframe.renderer({ instance, context })
    const tokens = [{ info: 'not-matching', map: [0, 1], children: null }]
    expect(config.render(tokens, 0)).toBe('')
  })

  it('validate returns truthy for iframe-inline directive', () => {
    const config = iframe.renderer({ instance, context })
    expect(config.validate('iframe-inline:bar')).toBeTruthy()
  })
})
