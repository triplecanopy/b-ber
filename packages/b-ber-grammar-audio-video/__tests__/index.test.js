import { getTarget } from '../../b-ber-lib/src/Target'
import audioVideo from '../src'

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
    const tokens = [{ info: 'not-matching', map: [0, 1], children: null }]
    expect(config.render(tokens, 0, {}, envFor())).toBe('')
  })

  it('render calls prepare and dispatches to createMedia for video type', () => {
    const config = audioVideo.renderer({ instance, context })
    const tokens = [
      { info: 'video:my-id source="media.mp4"', map: [0, 1], children: null },
    ]
    const result = config.render(tokens, 0, {}, envFor())
    expect(typeof result).toBe('string')
    expect(result.length).toBeGreaterThan(0)
  })

  it('render dispatches to createMedia for audio type', () => {
    const config = audioVideo.renderer({ instance, context })
    const tokens = [
      { info: 'audio:my-id source="sound.mp3"', map: [0, 1], children: null },
    ]
    const result = config.render(tokens, 0, {}, envFor())
    expect(typeof result).toBe('string')
  })

  it('render dispatches to createMediaInline for video-inline type', () => {
    const config = audioVideo.renderer({ instance, context })
    const tokens = [
      {
        info: 'video-inline:my-id source="media.mp4"',
        map: [0, 1],
        children: null,
      },
    ]
    const result = config.render(tokens, 0, {}, envFor())
    expect(typeof result).toBe('string')
  })

  it('render dispatches to createMediaInline for audio-inline type', () => {
    const config = audioVideo.renderer({ instance, context })
    const tokens = [
      {
        info: 'audio-inline:my-id source="sound.mp3"',
        map: [0, 1],
        children: null,
      },
    ]
    const result = config.render(tokens, 0, {}, envFor())
    expect(typeof result).toBe('string')
  })

  it('render handles token with null map', () => {
    const config = audioVideo.renderer({ instance, context })
    const tokens = [
      { info: 'video:my-id source="media.mp4"', map: null, children: null },
    ]
    expect(() => config.render(tokens, 0, {}, envFor())).not.toThrow()
  })

  it('render throws what log.error reports when the media does not exist', () => {
    const config = audioVideo.renderer({ instance, context })
    const tokens = [
      { info: 'video:my-id source="media.mp4"', map: [0, 1], children: null },
    ]
    expect(() => config.render(tokens, 0, {}, envFor([]))).toThrow(
      'Could not find [video] matching [media.mp4]'
    )
  })

  it('collects a video figure, and not an inline one', () => {
    const config = audioVideo.renderer({ instance, context })
    const env = envFor()
    config.render(
      [{ info: 'video:v source:media.mp4', map: [0, 1] }],
      0,
      {},
      env
    )
    config.render(
      [{ info: 'video-inline:w source:media.mp4', map: [1, 2] }],
      0,
      {},
      env
    )
    expect(env.result.figures).toEqual([
      expect.objectContaining({ id: 'v', pageOrder: 0, ref: 'test' }),
    ])
  })
})
