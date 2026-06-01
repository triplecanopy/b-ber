import audioVideo from '../src'

jest.mock('@canopycanopycanopy/b-ber-lib/State', () => ({
  build: 'epub',
  audio: [],
  video: [],
  figures: [],
  remoteAssets: [],
  add: jest.fn(),
  src: {
    images: p => p,
    audio: p => p,
    video: p => p,
  },
}))

jest.mock('@canopycanopycanopy/b-ber-logger', () => ({
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
}))

jest.mock('@canopycanopycanopy/b-ber-grammar-attributes', () => ({
  attributesString: jest.fn(() => ''),
  attributesObject: jest.fn(() => ({ source: 'media.mp4' })),
  htmlId: jest.fn(id => id),
  toAlias: jest.fn(s => s),
}))

jest.mock('@canopycanopycanopy/b-ber-lib', () => ({
  State: jest.requireMock('@canopycanopycanopy/b-ber-lib/State'),
  Html: { comment: jest.fn(s => s) },
  Url: { encodeQueryString: jest.fn(s => s), ensureDecoded: jest.fn(s => s) },
}))

const instance = { renderInline: jest.fn(str => str) }
const context = { fileName: 'test' }

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
    expect(config.render(tokens, 0)).toBe('')
  })

  it('render calls prepare and dispatches to createMedia for video type', () => {
    const config = audioVideo.renderer({ instance, context })
    const tokens = [
      { info: 'video:my-id source="media.mp4"', map: [0, 1], children: null },
    ]
    const result = config.render(tokens, 0)
    expect(typeof result).toBe('string')
    expect(result.length).toBeGreaterThan(0)
  })

  it('render dispatches to createMedia for audio type', () => {
    const config = audioVideo.renderer({ instance, context })
    const tokens = [
      { info: 'audio:my-id source="sound.mp3"', map: [0, 1], children: null },
    ]
    const result = config.render(tokens, 0)
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
    const result = config.render(tokens, 0)
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
    const result = config.render(tokens, 0)
    expect(typeof result).toBe('string')
  })

  it('render handles token with null map', () => {
    const config = audioVideo.renderer({ instance, context })
    const tokens = [
      { info: 'video:my-id source="media.mp4"', map: null, children: null },
    ]
    expect(() => config.render(tokens, 0)).not.toThrow()
  })
})
