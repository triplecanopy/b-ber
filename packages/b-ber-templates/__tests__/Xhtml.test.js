import fs from 'fs-extra'
import state from '@canopycanopycanopy/b-ber-lib/State'
import Xhtml from '../src/Xhtml'

jest.mock('@canopycanopycanopy/b-ber-lib/State', () => {
    // eslint-disable-next-line global-require
    const Config = require('@canopycanopycanopy/b-ber-lib/Config').default
    const config = new Config()
    return { config }
})

afterAll(() => fs.remove('_project'))

describe('templates.Xhtml', () => {
    it('creates a head element', () => {
        state.config.private = true
        expect(Xhtml.head().contents.toString()).toMatchSnapshot()

        state.config.private = false
        expect(Xhtml.head().contents.toString()).toMatchSnapshot()
    })

    it('creates a body element', () => {
        expect(Xhtml.body().contents.toString()).toMatchSnapshot()
        expect(Xhtml.tail().contents.toString()).toMatchSnapshot()
    })

    it('creates a cover page', () => {
        expect(Xhtml.cover({ width: 1, height: 1, href: 'test' })).toMatchSnapshot()
    })

    it('creates script elements', () => {
        expect(Xhtml.javascript().contents.toString()).toMatchSnapshot()
        expect(Xhtml.javascript(true).contents.toString()).toMatchSnapshot()
    })

    it('creates as link element', () => {
        expect(Xhtml.stylesheet().contents.toString()).toMatchSnapshot()
        expect(Xhtml.stylesheet(true).contents.toString()).toMatchSnapshot()
    })

    it('creates the loi elements', () => {
        expect(Xhtml.loi()).toMatchSnapshot()
    })
})
