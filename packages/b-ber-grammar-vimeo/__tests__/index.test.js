import { getTarget } from '../../b-ber-lib/src/Target'
import { h, serialize } from '../../b-ber-markdown-renderer/src/xhtml'
import vimeo from '../src'

const render = (config, node) => serialize(config.render({ node, env, h }))

jest.mock('@canopycanopycanopy/b-ber-logger', () => ({
  // Returns an Error, as the real log.error does, so that a site's
  // `throw log.error(...)` throws one rather than undefined
  error: jest.fn((err) =>
    err instanceof Error ? err : new Error(String(err))
  ),
  warn: jest.fn(),
  debug: jest.fn(),
}))

jest.mock('@canopycanopycanopy/b-ber-grammar-attributes', () => ({
  attributesQueryString: jest.fn(() => ''),
  attributesString: jest.fn(() => ''),
  attributesList: jest.fn(() => []),
  attributesQuery: jest.fn(() => ''),
  commentLines: jest.requireActual('../../b-ber-grammar-attributes/src')
    .commentLines,
  attributesObject: jest.fn(() => ({ source: '12345' })),
  htmlId: jest.fn((id) => id),
}))

jest.mock('@canopycanopycanopy/b-ber-lib', () => ({
  ...jest.requireActual('../../b-ber-lib/src/markdown'),
  Html: {
    comment: jest.fn((s) => s),
    escape: jest.requireActual('../../b-ber-lib/src/Html').default.escape,
  },
}))

const instance = { renderInline: jest.fn((str) => str) }
const context = { fileName: 'test' }

// The render's env, as the renderer passes it
const envFor = (target = 'epub') => ({
  document: {
    fileName: 'test',
    target: getTarget(target),
    images: (p) => p,
    figuresBefore: 0,
  },
  result: { figures: [] },
})
let env
beforeEach(() => {
  env = envFor()
})

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
    const node = { info: 'not-matching', line: 0 }
    expect(render(config, node)).toBe('')
  })

  it('validate returns truthy for vimeo-inline directive', () => {
    const config = vimeo.renderer({ instance, context })
    expect(config.validate('vimeo-inline:bar')).toBeTruthy()
  })

  it('render calls prepare and dispatches to createVimeo for vimeo type', () => {
    const config = vimeo.renderer({ instance, context })
    const node = { info: 'vimeo:my-id source="12345"', line: 0 }
    const result = render(config, node)
    expect(typeof result).toBe('string')
    expect(result.length).toBeGreaterThan(0)
  })

  it('render returns HTML containing figure id for vimeo type', () => {
    const config = vimeo.renderer({ instance, context })
    const node = { info: 'vimeo:my-id source="12345"', line: 0 }
    const result = render(config, node)
    expect(result).toContain('refmy-id')
    expect(env.result.figures).toEqual([
      expect.objectContaining({ id: 'my-id', pageOrder: 0, ref: 'test' }),
    ])
  })

  it('render dispatches to createUnsupportedInline for vimeo-inline on non-reader build', () => {
    const config = vimeo.renderer({ instance, context })
    const node = { info: 'vimeo-inline:my-id source="12345"', line: 0 }
    const result = render(config, node)
    expect(typeof result).toBe('string')
    expect(result).toContain('media__fallback')
  })

  it('render handles token with children (caption rendered via renderInline)', () => {
    const config = vimeo.renderer({ instance, context })
    const node = {
      info: 'vimeo:cap-id source="12345"',
      line: 0,
      caption: 'caption text',
    }
    const result = render(config, node)
    expect(typeof result).toBe('string')
    expect(instance.renderInline).toHaveBeenCalledWith('caption text', env)
  })
})
