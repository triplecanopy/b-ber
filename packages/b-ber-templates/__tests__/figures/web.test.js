import fs from 'fs-extra'
import web from '../../src/figures/web'

jest.mock('@canopycanopycanopy/b-ber-lib/State', () => ({}))

afterAll(() => fs.remove('_project'))

describe('templates.web', () => {
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

    expect(web.portrait(data)).toMatchSnapshot()
    expect(web.landscape(data)).toMatchSnapshot()
    expect(web['portrait-high'](data)).toMatchSnapshot()
    expect(web.square(data)).toMatchSnapshot()
    expect(web.audio(data)).toMatchSnapshot()
    expect(web.video(data)).toMatchSnapshot()
    expect(web.iframe(data)).toMatchSnapshot()
    expect(web.vimeo(data)).toMatchSnapshot()

    expect(web.portrait(dataFiguresPage)).toMatchSnapshot()
    expect(web.landscape(dataFiguresPage)).toMatchSnapshot()
    expect(web['portrait-high'](dataFiguresPage)).toMatchSnapshot()
    expect(web.square(dataFiguresPage)).toMatchSnapshot()
    expect(web.audio(dataFiguresPage)).toMatchSnapshot()
    expect(web.video(dataFiguresPage)).toMatchSnapshot()
    expect(web.iframe(dataFiguresPage)).toMatchSnapshot()

    expect(web.portrait(dataPagebreakBefore)).toMatchSnapshot()
    expect(web.landscape(dataPagebreakBefore)).toMatchSnapshot()
    expect(web['portrait-high'](dataPagebreakBefore)).toMatchSnapshot()
    expect(web.square(dataPagebreakBefore)).toMatchSnapshot()
    expect(web.audio(dataPagebreakBefore)).toMatchSnapshot()
    expect(web.video(dataPagebreakBefore)).toMatchSnapshot()
    expect(web.iframe(dataPagebreakBefore)).toMatchSnapshot()
  })
})
