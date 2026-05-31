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

jest.mock('@canopycanopycanopy/b-ber-grammar-attributes', () => ({
  attributesString: jest.fn(() => ''),
  attributesObject: jest.fn(() => ({ source: 'https://example.com/embed' })),
  htmlId: jest.fn(id => id),
}))

jest.mock('@canopycanopycanopy/b-ber-lib', () => ({
  Html: { comment: jest.fn(s => s) },
  Url: { ensureDecoded: jest.fn(s => s) },
}))

jest.mock('@canopycanopycanopy/b-ber-lib/utils', () => ({
  createUnsupportedInline: jest.fn(() => '<div class="unsupported"></div>'),
  getMediaType: jest.fn(type => type.replace(/-.*$/, '')),
  renderCaption: jest.fn(() => ''),
  renderPosterImage: jest.fn(() => ''),
  ensureSource: jest.fn(),
  ensurePoster: jest.fn(),
  ensureSupportedClassNames: jest.fn(),
}))

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

  it('render dispatches to createIframe and calls state.add for iframe type', () => {
    const config = iframe.renderer({ instance, context })
    const tokens = [
      {
        info: 'iframe:test-id source="https://example.com/embed"',
        map: [0, 1],
        children: null,
      },
    ]
    const result = config.render(tokens, 0)
    expect(typeof result).toBe('string')
    expect(result.length).toBeGreaterThan(0)
  })

  it('render dispatches to createUnsupportedInline for iframe-inline on epub build', () => {
    const config = iframe.renderer({ instance, context })
    const tokens = [
      {
        info: 'iframe-inline:test-id source="https://example.com/embed"',
        map: [0, 1],
        children: null,
      },
    ]
    const result = config.render(tokens, 0)
    expect(result).toBe('<div class="unsupported"></div>')
  })

  it('render handles iframe-inline for reader build (calls createIframeInline)', () => {
    const state = jest.requireMock('@canopycanopycanopy/b-ber-lib/State')
    const originalBuild = state.build
    state.build = 'web'
    const config = iframe.renderer({ instance, context })
    const tokens = [
      {
        info: 'iframe-inline:test-id source="https://example.com/embed"',
        map: [0, 1],
        children: null,
      },
    ]
    const result = config.render(tokens, 0)
    expect(typeof result).toBe('string')
    state.build = originalBuild
  })

  it('render handles token with null map', () => {
    const config = iframe.renderer({ instance, context })
    const tokens = [
      {
        info: 'iframe:test-id source="https://example.com/embed"',
        map: null,
        children: null,
      },
    ]
    expect(() => config.render(tokens, 0)).not.toThrow()
  })
})
