/* global expect,beforeAll,afterAll */

import path from 'path'
import mock from 'mock-fs'
import ManifestItemProperties from '../src/ManifestItemProperties'

jest.mock('../src/Spine')
jest.mock('../src/SpineItem')

const html = { absolutePath: path.resolve(__dirname, 'file.xhtml') }
const nav = {
    absolutePath: path.resolve(__dirname, 'toc.xhtml'),
    name: 'toc.xhtml',
}
const scriptFile = { absolutePath: '/mocks/script.xhtml' }
const svgFile = { absolutePath: '/mocks/svg.xhtml' }

beforeAll(() => {
    mock({
        '/mocks': {
            'script.xhtml': '<html><script></script></html>',
            'svg.xhtml': '<html><svg></svg></html>',
        },
    })
})

afterAll(() => mock.restore())

describe('ManifestItemProperties', () => {
    describe('#isHTML', () => {
        it('Tests if a document is an (X)HTML file', done => {
            expect(ManifestItemProperties.isHTML(html)).toBe(true)
            done()
        })
    })

    describe('#isNav', () => {
        it('Tests if a document is an Epub navigation document', done => {
            expect(ManifestItemProperties.isNav(nav)).toBe(true)
            done()
        })
    })

    describe('#isScripted', () => {
        it('Tests if a document contains a script element', done => {
            expect(ManifestItemProperties.isScripted(scriptFile)).toBe(true)
            done()
        })
    })

    describe('#isSVG', () => {
        it('Tests if a document contains an SVG element', done => {
            expect(ManifestItemProperties.isSVG(svgFile)).toBe(true)
            done()
        })
    })

    describe('#isDCElement', () => {
        it.todo('Tests if the term property of an object exists in the dc/elements object')
    })

    describe('#isDCTerm', () => {
        it.todo('Tests if the term property of an object exists in the dc/terms object')
    })

    describe('#testHTML', () => {
        it.todo('Tests if a document contains a script or SVG element, and if it is an Epub navigation document')
    })

    describe('#testMeta', () => {
        it.todo('Returns an object with tested term and element properties values')
    })
})
