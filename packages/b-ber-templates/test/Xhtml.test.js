import state from '@canopycanopycanopy/b-ber-lib/State'
import Xhtml from '../src/Xhtml'

describe('templates.Xhtml', () => {
    it('creates a head element', () => {

        state.config.private = true
        expect(Xhtml.head()).toMatchSnapshot()

        state.config.private = false
        expect(Xhtml.head()).toMatchSnapshot()
    })

    it('creates a body element', () => {
        expect(Xhtml.body().contents).toMatchSnapshot()
        expect(Xhtml.body().history).toMatchSnapshot()
        expect(Xhtml.tail()).toMatchSnapshot()
    })

    it('creates a cover page', () => {
        expect(Xhtml.cover({width: 1, height: 1, href: 'test'})).toMatchSnapshot()
    })

    it('creates a script element', () => {
        expect(Xhtml.script()).toMatchSnapshot()
    })

    it('creates as link element', () => {
        expect(Xhtml.stylesheet()).toMatchSnapshot()
    })

    it('creates the loi elements', () => {
        expect(Xhtml.loi()).toMatchSnapshot()
    })

    it('creates an html document', () => {
        expect(Xhtml.document().contents).toMatchSnapshot()
        expect(Xhtml.document().history).toMatchSnapshot()
    })

})
