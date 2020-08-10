import fs from 'fs-extra'
import reader from '../../src/figures/reader'

jest.mock('@canopycanopycanopy/b-ber-lib/State', () => ({}))

afterAll(() => fs.remove('_project'))

describe('templates.reader', () => {
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

    const dataFiguresPage = Object.assign({}, data, { inline: false })
    const dataPagebreakBefore = Object.assign({}, data, {
      classes: 'break-before',
    })

    expect(reader.portrait(data)).toMatchSnapshot()
    expect(reader.landscape(data)).toMatchSnapshot()
    expect(reader['portrait-high'](data)).toMatchSnapshot()
    expect(reader.square(data)).toMatchSnapshot()
    expect(reader.audio(data)).toMatchSnapshot()
    expect(reader.video(data)).toMatchSnapshot()
    expect(reader.iframe(data)).toMatchSnapshot()
    expect(reader.vimeo(data)).toMatchSnapshot()
    expect(reader.soundcloud(data)).toMatchSnapshot()

    expect(reader.portrait(dataFiguresPage)).toMatchSnapshot()
    expect(reader.landscape(dataFiguresPage)).toMatchSnapshot()
    expect(reader['portrait-high'](dataFiguresPage)).toMatchSnapshot()
    expect(reader.square(dataFiguresPage)).toMatchSnapshot()
    expect(reader.audio(dataFiguresPage)).toMatchSnapshot()
    expect(reader.video(dataFiguresPage)).toMatchSnapshot()
    expect(reader.iframe(dataFiguresPage)).toMatchSnapshot()

    expect(reader.portrait(dataPagebreakBefore)).toMatchSnapshot()
    expect(reader.landscape(dataPagebreakBefore)).toMatchSnapshot()
    expect(reader['portrait-high'](dataPagebreakBefore)).toMatchSnapshot()
    expect(reader.square(dataPagebreakBefore)).toMatchSnapshot()
    expect(reader.audio(dataPagebreakBefore)).toMatchSnapshot()
    expect(reader.video(dataPagebreakBefore)).toMatchSnapshot()
    expect(reader.iframe(dataPagebreakBefore)).toMatchSnapshot()
  })
})
