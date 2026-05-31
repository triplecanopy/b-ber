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
})
