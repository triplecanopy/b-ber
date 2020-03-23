import state from '@canopycanopycanopy/b-ber-lib/State'
import log from '@canopycanopycanopy/b-ber-logger'
import media from '../src'

jest.mock('@canopycanopycanopy/b-ber-logger', () => ({
  error: jest.fn(),
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

describe('b-ber-grammar-media', () => {
  beforeEach(() => {
    state.build = 'epub'
  })

  it('processes the Markdown', () => {
    const input = '# foo'
    const result = media.render(input)

    expect(result).toEqual(input)
  })

  it('replaces a directive', () => {
    const input = `# test\n\n::: media:foo\n`
    const expected = `# test\n\n::: video:foo source:"demo-video" controls:"yes" poster:"my-image.jpg" classes:"myfoo"\n:: here is a caption\n::\n\n\n`
    const result = media.render(input)

    expect(result).toEqual(expected)
  })

  it('replaces a directive in a file with no linebreaks', () => {
    const input = `::: media:foo`
    const expected = `::: video:foo source:"demo-video" controls:"yes" poster:"my-image.jpg" classes:"myfoo"\n:: here is a caption\n::\n\n`
    const result = media.render(input)

    expect(result).toEqual(expected)
  })

  it('replaces multiple directives', () => {
    const input = `# test\n\n::: media:foo\n\n::: media:bar\n`
    const expected = `# test\n\n::: video:foo source:"demo-video" controls:"yes" poster:"my-image.jpg" classes:"myfoo"\n:: here is a caption\n::\n\n\n\n::: video:bar source:"demo-video" controls:"yes" poster:"my-image.jpg" classes:"mybar"\n:: here is a caption\n::\n\n\n`
    const result = media.render(input)

    expect(result).toEqual(expected)
  })

  it('replaces directives based on build', () => {
    state.build = 'reader'

    const input = `# test\n\n::: media:foo\n`
    const expected = `# test\n\n::: vimeo:foo source:"76979871" color:"f00" controls:"yes" poster:"my-image.jpg" classes:"myfoo"\n:: here is a caption\n::\n\n\n`
    const result = media.render(input)

    expect(result).toEqual(expected)
  })

  it('throws a missing ID error', () => {
    const input = `# test\n\n::: media\n`
    const spy = jest.spyOn(log, 'error')

    expect(() => media.render(input)).toThrow()
    expect(spy).toHaveBeenCalled()
  })

  it('throws a missing declaration error', () => {
    const input = `# test\n\n::: media:xyz\n`
    const spy = jest.spyOn(log, 'error')

    expect(() => media.render(input)).toThrow()
    expect(spy).toHaveBeenCalled()
  })
})
