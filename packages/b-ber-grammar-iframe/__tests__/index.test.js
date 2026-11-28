import fs from 'fs-extra'
import { getTarget } from '../../b-ber-lib/src/Target'
import iframe from '../src'

jest.mock('@canopycanopycanopy/b-ber-logger', () => ({
  error: jest.fn((message) => new Error(message)),
  warn: jest.fn(),
  debug: jest.fn(),
}))

jest.mock('fs-extra', () => ({ existsSync: jest.fn(() => true) }))

jest.mock('@canopycanopycanopy/b-ber-grammar-attributes', () => ({
  attributesString: jest.fn((attrs) => ` class="${attrs.classes}"`),
  attributesObject: jest.fn((attrs) =>
    /poster/.test(attrs)
      ? { source: 'https://example.com/embed', poster: 'p.jpg' }
      : { source: 'https://example.com/embed' }
  ),
  htmlId: jest.fn((id) => id),
}))

jest.mock('@canopycanopycanopy/b-ber-lib', () => ({
  ...jest.requireActual('../../b-ber-lib/src/markdown'),
  Html: {
    comment: jest.fn((s) => s),
    escape: jest.requireActual('../../b-ber-lib/src/Html').default.escape,
  },
  Url: { ensureDecoded: jest.fn((s) => s) },
  utils: jest.requireMock('@canopycanopycanopy/b-ber-lib/utils'),
}))

jest.mock('@canopycanopycanopy/b-ber-lib/utils', () => ({
  createUnsupportedInline: jest.fn(() => '<div class="unsupported"></div>'),
  getMediaType: jest.fn((type) => type.replace(/-.*$/, '')),
  renderCaption: jest.fn(() => ''),
  renderPosterImage: jest.fn(() => ''),
  ensureSource: jest.fn(),
}))

const instance = { renderInline: jest.fn((str) => str) }
const context = { fileName: 'test' }

// The render's env, as the renderer passes it
const envFor = (target = 'epub') => ({
  document: {
    fileName: 'test',
    target: getTarget(target),
    images: (p) => `/images/${p}`,
    figuresBefore: 0,
  },
  result: { figures: [] },
})

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
    expect(config.render(tokens, 0, {}, envFor())).toBe('')
  })

  it('validate returns truthy for iframe-inline directive', () => {
    const config = iframe.renderer({ instance, context })
    expect(config.validate('iframe-inline:bar')).toBeTruthy()
  })

  it('render dispatches to createIframe and collects the figure for iframe type', () => {
    const config = iframe.renderer({ instance, context })
    const tokens = [
      {
        info: 'iframe:test-id source="https://example.com/embed"',
        map: [0, 1],
        children: null,
      },
    ]
    const env = envFor()
    const result = config.render(tokens, 0, {}, env)
    expect(typeof result).toBe('string')
    expect(result.length).toBeGreaterThan(0)
    expect(env.result.figures).toEqual([
      expect.objectContaining({ id: 'test-id', pageOrder: 0, ref: 'test' }),
    ])
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
    const result = config.render(tokens, 0, {}, envFor())
    expect(result).toBe('<div class="unsupported"></div>')
  })

  it('render handles iframe-inline for reader build (calls createIframeInline)', () => {
    const config = iframe.renderer({ instance, context })
    const tokens = [
      {
        info: 'iframe-inline:test-id source="https://example.com/embed"',
        map: [0, 1],
        children: null,
      },
    ]
    const result = config.render(tokens, 0, {}, envFor('web'))
    expect(typeof result).toBe('string')
    expect(result).not.toBe('<div class="unsupported"></div>')
  })

  // b-ber-lib's ensureSupportedClassNames and ensurePoster read State
  it('marks the embed as supported where the target has live embeds', () => {
    const config = iframe.renderer({ instance, context })
    const tokens = [{ info: 'iframe:a source:x', map: [0, 1] }]
    const epub = envFor('epub')
    const web = envFor('web')
    config.render(tokens, 0, {}, epub)
    config.render(tokens, 0, {}, web)
    expect(epub.result.figures[0].classes).toBe(' embed unsupported')
    expect(web.result.figures[0].classes).toBe(' embed supported')
  })

  it('takes the poster from the project’s images, and throws when it is missing', () => {
    const config = iframe.renderer({ instance, context })
    const tokens = [{ info: 'iframe:a source:x poster', map: [0, 1] }]
    const env = envFor()
    config.render(tokens, 0, {}, env)
    expect(fs.existsSync).toHaveBeenCalledWith('/images/p.jpg')
    expect(env.result.figures[0].poster).toBe('../images/p.jpg')

    fs.existsSync.mockReturnValueOnce(false)
    expect(() => config.render(tokens, 0, {}, envFor())).toThrow(
      'Poster image for [iframe] does not exist'
    )
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
    expect(() => config.render(tokens, 0, {}, envFor())).not.toThrow()
  })
})
