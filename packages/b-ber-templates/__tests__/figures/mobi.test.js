import fs from 'fs-extra'
import mobi from '../../src/figures/mobi'

jest.mock('@canopycanopycanopy/b-ber-lib/State', () => ({}))

afterAll(() => fs.remove('_project'))

describe('templates.mobi', () => {
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
    }

    const dataFiguresPage = Object.assign({}, data, { inline: false })
    const dataPagebreakBefore = Object.assign({}, data, {
      classes: 'break-before',
    })

    expect(mobi.portrait(data)).toMatchSnapshot()
    expect(mobi.landscape(data)).toMatchSnapshot()
    expect(mobi['portrait-high'](data)).toMatchSnapshot()
    expect(mobi.square(data)).toMatchSnapshot()
    expect(mobi.audio(data)).toMatchSnapshot()
    expect(mobi.video(data)).toMatchSnapshot()
    expect(mobi.iframe(data)).toMatchSnapshot()

    expect(mobi.portrait(dataFiguresPage)).toMatchSnapshot()
    expect(mobi.landscape(dataFiguresPage)).toMatchSnapshot()
    expect(mobi['portrait-high'](dataFiguresPage)).toMatchSnapshot()
    expect(mobi.square(dataFiguresPage)).toMatchSnapshot()
    expect(mobi.audio(dataFiguresPage)).toMatchSnapshot()
    expect(mobi.video(dataFiguresPage)).toMatchSnapshot()
    expect(mobi.iframe(dataFiguresPage)).toMatchSnapshot()

    expect(mobi.portrait(dataPagebreakBefore)).toMatchSnapshot()
    expect(mobi.landscape(dataPagebreakBefore)).toMatchSnapshot()
    expect(mobi['portrait-high'](dataPagebreakBefore)).toMatchSnapshot()
    expect(mobi.square(dataPagebreakBefore)).toMatchSnapshot()
    expect(mobi.audio(dataPagebreakBefore)).toMatchSnapshot()
    expect(mobi.video(dataPagebreakBefore)).toMatchSnapshot()
    expect(mobi.iframe(dataPagebreakBefore)).toMatchSnapshot()
  })
})
