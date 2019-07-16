import mobi from '../../src/figures/mobi'

jest.mock('@canopycanopycanopy/b-ber-lib/State', () => ({}))

describe('templates.mobi', () => {
    test('creates the markup', () => {
        const data = {
            inline: true,
            classes: ['test'],
            pagebreak: '',
            id: 1,
            ref: 1,
            alt: 'test',
            source: 'test',
            caption: 'test',
        }

        expect(mobi.portrait(data)).toMatchSnapshot()
        expect(mobi.landscape(data)).toMatchSnapshot()
        expect(mobi['portrait-high'](data)).toMatchSnapshot()
        expect(mobi.square(data)).toMatchSnapshot()
        expect(mobi.audio(data)).toMatchSnapshot()
        expect(mobi.video(data)).toMatchSnapshot()
        expect(mobi.iframe(data)).toMatchSnapshot()

        data.inline = false
        expect(mobi.portrait(data)).toMatchSnapshot()
        expect(mobi.landscape(data)).toMatchSnapshot()
        expect(mobi['portrait-high'](data)).toMatchSnapshot()
        expect(mobi.square(data)).toMatchSnapshot()
        expect(mobi.audio(data)).toMatchSnapshot()
        expect(mobi.video(data)).toMatchSnapshot()
        expect(mobi.iframe(data)).toMatchSnapshot()

        data.pagebreak = 'before'
        expect(mobi.portrait(data)).toMatchSnapshot()
        expect(mobi.landscape(data)).toMatchSnapshot()
        expect(mobi['portrait-high'](data)).toMatchSnapshot()
        expect(mobi.square(data)).toMatchSnapshot()
        expect(mobi.audio(data)).toMatchSnapshot()
        expect(mobi.video(data)).toMatchSnapshot()
        expect(mobi.iframe(data)).toMatchSnapshot()

        data.pagebreak = 'after'
        expect(mobi.portrait(data)).toMatchSnapshot()
        expect(mobi.landscape(data)).toMatchSnapshot()
        expect(mobi['portrait-high'](data)).toMatchSnapshot()
        expect(mobi.square(data)).toMatchSnapshot()
        expect(mobi.audio(data)).toMatchSnapshot()
        expect(mobi.video(data)).toMatchSnapshot()
        expect(mobi.iframe(data)).toMatchSnapshot()
    })
})
