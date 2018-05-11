import epub from '../../src/figures/epub'

describe('templates.epub', () => {
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

        expect(epub.portrait(data)).toMatchSnapshot()
        expect(epub.landscape(data)).toMatchSnapshot()
        expect(epub['portrait-high'](data)).toMatchSnapshot()
        expect(epub.square(data)).toMatchSnapshot()
        expect(epub.audio(data)).toMatchSnapshot()
        expect(epub.video(data)).toMatchSnapshot()
        expect(epub.iframe(data)).toMatchSnapshot()

        data.inline = false
        expect(epub.portrait(data)).toMatchSnapshot()
        expect(epub.landscape(data)).toMatchSnapshot()
        expect(epub['portrait-high'](data)).toMatchSnapshot()
        expect(epub.square(data)).toMatchSnapshot()
        expect(epub.audio(data)).toMatchSnapshot()
        expect(epub.video(data)).toMatchSnapshot()
        expect(epub.iframe(data)).toMatchSnapshot()

        data.pagebreak = 'before'
        expect(epub.portrait(data)).toMatchSnapshot()
        expect(epub.landscape(data)).toMatchSnapshot()
        expect(epub['portrait-high'](data)).toMatchSnapshot()
        expect(epub.square(data)).toMatchSnapshot()
        expect(epub.audio(data)).toMatchSnapshot()
        expect(epub.video(data)).toMatchSnapshot()
        expect(epub.iframe(data)).toMatchSnapshot()

        data.pagebreak = 'after'
        expect(epub.portrait(data)).toMatchSnapshot()
        expect(epub.landscape(data)).toMatchSnapshot()
        expect(epub['portrait-high'](data)).toMatchSnapshot()
        expect(epub.square(data)).toMatchSnapshot()
        expect(epub.audio(data)).toMatchSnapshot()
        expect(epub.video(data)).toMatchSnapshot()
        expect(epub.iframe(data)).toMatchSnapshot()


    })
})
