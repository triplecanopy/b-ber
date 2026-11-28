import { getTarget } from '../../b-ber-lib/src/Target'
import { h, serialize } from '../../b-ber-markdown-renderer/src/xhtml'
import audioVideo from '../src'

const render = (config, node, env) => serialize(config.render({ node, env, h }))

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
  attributesString: jest.fn(() => ''),
  attributesList: jest.fn((obj) =>
    obj.controls ? [['controls', obj.controls]] : []
  ),
  commentLines: jest.requireActual('../../b-ber-grammar-attributes/src')
    .commentLines,
  attributesObject: jest.fn(() => ({ source: 'media.mp4' })),
  htmlId: jest.fn((id) => id),
  toAlias: jest.fn((s) => s),
}))

jest.mock('@canopycanopycanopy/b-ber-lib', () => ({
  ...jest.requireActual('../../b-ber-lib/src/markdown'),
  Html: {
    comment: jest.fn((s) => s),
    escape: jest.requireActual('../../b-ber-lib/src/Html').default.escape,
  },
  Url: {
    encodeQueryString: jest.fn((s) => s),
    ensureDecoded: jest.fn((s) => s),
  },
}))

const instance = { renderInline: jest.fn((str) => str) }
const context = { fileName: 'test' }

// The render's env, as the renderer passes it
const envFor = (video = ['media.mp4']) => ({
  document: {
    fileName: 'test',
    target: getTarget('epub'),
    images: (p) => p,
    // The attributes mock gives every directive this source, which must exist
    audio: ['media.mp4'],
    video,
    figuresBefore: 0,
  },
  result: { figures: [], remoteAssets: [] },
})

describe('b-ber-grammar-audio-video', () => {
  it('exports plugin, name, and renderer', () => {
    expect(audioVideo.plugin).toBeFunction()
    expect(audioVideo.name).toBe('audio-video')
    expect(audioVideo.renderer).toBeFunction()
  })

  it('renderer returns a config object', () => {
    const config = audioVideo.renderer({ instance, context })
    expect(config.marker).toBeDefined()
    expect(config.minMarkers).toBeNumber()
    expect(config.validate).toBeFunction()
    expect(config.render).toBeFunction()
  })

  it('validate returns truthy for video directive', () => {
    const config = audioVideo.renderer({ instance, context })
    expect(config.validate('video:foo')).toBeTruthy()
  })

  it('validate returns truthy for audio directive', () => {
    const config = audioVideo.renderer({ instance, context })
    expect(config.validate('audio:foo')).toBeTruthy()
  })

  it('validate returns falsy for non-audio-video directive', () => {
    const config = audioVideo.renderer({ instance, context })
    expect(config.validate('image:foo')).toBeFalsy()
  })

  it('validate returns falsy for figure directive', () => {
    const config = audioVideo.renderer({ instance, context })
    expect(config.validate('figure:foo')).toBeFalsy()
  })

  it('render returns empty string when token info does not match DIRECTIVE_RE', () => {
    const config = audioVideo.renderer({ instance, context })
    const node = { info: 'not-matching', line: 0 }
    expect(render(config, node, envFor())).toBe('')
  })

  it('render calls prepare and dispatches to createMedia for video type', () => {
    const config = audioVideo.renderer({ instance, context })
    const node = { info: 'video:my-id source="media.mp4"', line: 0 }
    const result = render(config, node, envFor())
    expect(typeof result).toBe('string')
    expect(result.length).toBeGreaterThan(0)
  })

  it('render dispatches to createMedia for audio type', () => {
    const config = audioVideo.renderer({ instance, context })
    const node = { info: 'audio:my-id source="sound.mp3"', line: 0 }
    const result = render(config, node, envFor())
    expect(typeof result).toBe('string')
  })

  it('render dispatches to createMediaInline for video-inline type', () => {
    const config = audioVideo.renderer({ instance, context })
    const node = { info: 'video-inline:my-id source="media.mp4"', line: 0 }
    const result = render(config, node, envFor())
    expect(typeof result).toBe('string')
  })

  it('render dispatches to createMediaInline for audio-inline type', () => {
    const config = audioVideo.renderer({ instance, context })
    const node = { info: 'audio-inline:my-id source="sound.mp3"', line: 0 }
    const result = render(config, node, envFor())
    expect(typeof result).toBe('string')
  })

  it('render throws what log.error reports when the media does not exist', () => {
    const config = audioVideo.renderer({ instance, context })
    const node = { info: 'video:my-id source="media.mp4"', line: 0 }
    expect(() => render(config, node, envFor([]))).toThrow(
      'Could not find [video] matching [media.mp4]'
    )
  })

  // Built as elements (TASK-176)
  it('builds an inline video with its sources and fallback', () => {
    const config = audioVideo.renderer({ instance, context })
    const html = render(
      config,
      { info: 'video-inline:w source:media.mp4', line: 0, caption: 'Cap' },
      envFor()
    )
    expect(html).toContain(
      '<video id="w" controls="controls">\n          <source src="../media/media.mp4" type="video/mp4"/>'
    )
    expect(html).toContain('Your device does not support the HTML5 video API.')
    expect(html).toContain('<p class="caption caption__video">Cap</p>')
  })

  it('collects a video figure, and not an inline one', () => {
    const config = audioVideo.renderer({ instance, context })
    const env = envFor()
    render(config, { info: 'video:v source:media.mp4', line: 0 }, env)
    render(config, { info: 'video-inline:w source:media.mp4', line: 1 }, env)
    expect(env.result.figures).toEqual([
      expect.objectContaining({ id: 'v', pageOrder: 0, ref: 'test' }),
    ])
  })
})
