import fs from 'fs-extra'
import 'image-size'
import epub from '../../src/figures/epub'

jest.mock('image-size', () => jest.fn(() => ({ width: 100, height: 150 })))
jest.mock('@canopycanopycanopy/b-ber-lib/State', () => ({
  build: 'epub',
  src: { images: path => path },
}))

afterAll(() => fs.remove('_project'))

describe('templates.epub', () => {
  test('creates the markup', () => {
    const data = {
      inline: true,
      classes: 'test',
      id: 1,
      ref: 1,
      alt: 'test',
      source: 'test',
      caption: 'test',
      attrString: 'autoplay="false"',
      sourceElements: '<source />',
      mediaType: 'audio-or-video',
      poster: 'test.jpg',
      title: 'test-title',
      width: 'test-width',
      height: 'test-height',
    }

    const dataFiguresPage = { ...data, inline: false }
    const dataPagebreakBefore = { ...data, classes: 'break-before' }

    expect(epub.portrait(data)).toMatchSnapshot()
    expect(epub.landscape(data)).toMatchSnapshot()
    expect(epub['portrait-high'](data)).toMatchSnapshot()
    expect(epub.square(data)).toMatchSnapshot()
    expect(epub.audio(data)).toMatchSnapshot()
    expect(epub.video(data)).toMatchSnapshot()
    expect(epub.iframe(data)).toMatchSnapshot()

    expect(epub.portrait(dataFiguresPage)).toMatchSnapshot()
    expect(epub.landscape(dataFiguresPage)).toMatchSnapshot()
    expect(epub['portrait-high'](dataFiguresPage)).toMatchSnapshot()
    expect(epub.square(dataFiguresPage)).toMatchSnapshot()
    expect(epub.audio(dataFiguresPage)).toMatchSnapshot()
    expect(epub.video(dataFiguresPage)).toMatchSnapshot()
    expect(epub.iframe(dataFiguresPage)).toMatchSnapshot()

    expect(epub.portrait(dataPagebreakBefore)).toMatchSnapshot()
    expect(epub.landscape(dataPagebreakBefore)).toMatchSnapshot()
    expect(epub['portrait-high'](dataPagebreakBefore)).toMatchSnapshot()
    expect(epub.square(dataPagebreakBefore)).toMatchSnapshot()
    expect(epub.audio(dataPagebreakBefore)).toMatchSnapshot()
    expect(epub.video(dataPagebreakBefore)).toMatchSnapshot()
    expect(epub.iframe(dataPagebreakBefore)).toMatchSnapshot()
  })

  test('vimeo() renders unsupported figure markup using poster image', () => {
    const data = {
      inline: true,
      classes: 'test',
      id: 1,
      ref: 1,
      alt: 'test',
      source: '123456',
      caption: 'test',
      attrString: '',
      attrQuery: '',
      sourceElements: '',
      mediaType: 'vimeo',
      poster: 'test.jpg',
      title: 'test-title',
      aspectRatioClassName: 'aspect-ratio-16-9',
    }
    expect(epub.vimeo(data)).toMatchSnapshot()
  })
})
