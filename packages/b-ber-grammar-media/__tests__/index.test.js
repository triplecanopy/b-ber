import state from '@canopycanopycanopy/b-ber-lib/State'
import log from '@canopycanopycanopy/b-ber-logger'
import { resolve } from '../src'

jest.mock('@canopycanopycanopy/b-ber-logger', () => ({
  // Returns an Error, as the real log.error does, so that a site's
  // `throw log.error(...)` throws one rather than undefined
  error: jest.fn((err) =>
    err instanceof Error ? err : new Error(String(err))
  ),
}))

jest.mock('@canopycanopycanopy/b-ber-lib/State', () => ({
  build: 'epub',
  media: {
    foo: {
      mobi: {
        type: 'figure',
        source: 'my-image.jpg',
        classes: 'foo bar baz',
      },
      xml: { type: 'figure', source: 'my-image.jpg', classes: 'foo bar baz' },
      pdf: { type: 'figure', source: 'my-image.jpg', classes: 'foo bar baz' },
      reader: {
        type: 'vimeo',
        source: 76979871,
        color: 'f00',
        controls: 'yes',
        poster: 'my-image.jpg',
        classes: 'myfoo',
        caption: 'here is a caption',
      },
      epub: {
        type: 'video',
        source: 'demo-video',
        controls: 'yes',
        poster: 'my-image.jpg',
        classes: 'myfoo',
        caption: 'here is a caption',
      },
    },
    bar: {
      mobi: {
        type: 'figure',
        source: 'my-image.jpg',
        classes: 'foo bar baz',
      },
      xml: { type: 'figure', source: 'my-image.jpg', classes: 'foo bar baz' },
      pdf: { type: 'figure', source: 'my-image.jpg', classes: 'foo bar baz' },
      reader: {
        type: 'vimeo',
        source: 76979871,
        color: 'f00',
        controls: 'yes',
        poster: 'my-image.jpg',
        classes: 'mybar',
        caption: 'here is a caption',
      },
      epub: {
        type: 'video',
        source: 'demo-video',
        controls: 'yes',
        poster: 'my-image.jpg',
        classes: 'mybar',
        caption: 'here is a caption',
      },
    },
  },
}))

// `resolve` gives exactly the line and caption the pre-pass used to splice
// into the Markdown for each target (TASK-175)
describe('b-ber-grammar-media resolve', () => {
  const resolveFor = (build, id = 'foo', type = 'media') =>
    resolve({ type, id, build, media: state.media })

  it('resolves to the directive media.yml names for the target, with its caption', () => {
    expect(resolveFor('epub')).toEqual({
      params:
        ' video:foo source:"demo-video" controls:"yes" poster:"my-image.jpg" classes:"myfoo"',
      caption: ' here is a caption\n',
      source:
        '::: video:foo source:"demo-video" controls:"yes" poster:"my-image.jpg" classes:"myfoo"\n:: here is a caption\n::\n\n',
    })
  })

  it('resolves per target', () => {
    expect(resolveFor('reader').params).toBe(
      ' vimeo:foo source:"76979871" color:"f00" controls:"yes" poster:"my-image.jpg" classes:"myfoo"'
    )
    expect(resolveFor('mobi')).toEqual({
      params: ' figure:foo source:"my-image.jpg" classes:"foo bar baz"',
      source: '::: figure:foo source:"my-image.jpg" classes:"foo bar baz"',
    })
  })

  it('resolves media-inline to the inline form', () => {
    expect(resolveFor('mobi', 'bar', 'media-inline').params).toBe(
      ' figure-inline:bar source:"my-image.jpg" classes:"foo bar baz"'
    )
  })

  it('throws a missing ID error', () => {
    const spy = jest.spyOn(log, 'error')
    expect(() =>
      resolve({
        type: 'media',
        id: undefined,
        build: 'epub',
        media: state.media,
      })
    ).toThrow('Missing ID [undefined]')
    expect(spy).toHaveBeenCalled()
  })

  it('throws a missing declaration error', () => {
    const spy = jest.spyOn(log, 'error')
    expect(() => resolveFor('epub', 'xyz')).toThrow('Missing ID [xyz]')
    expect(() =>
      resolve({ type: 'media', id: 'foo', build: 'sample', media: state.media })
    ).toThrow('Missing build type [sample]')
    expect(spy).toHaveBeenCalled()
  })
})
