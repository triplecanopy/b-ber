'use strict'

/* eslint-disable no-unused-expressions, no-multi-spaces */

const should = require('chai').should() // eslint-disable-line no-unused-vars
const path = require('path')
const fs = require('fs-extra')
const ManifestItemProperties = require('../props').default

const cwd = process.cwd()
const htmlFileObject = {rootPath: path.join(cwd, 'src/__tests__/.tmp', 'file.xhtml')}
const navDocument    = {rootPath: path.join(cwd, 'src/__tests__/.tmp', 'toc.xhtml'), name: 'toc.xhtml'} // eslint-disable-line max-len
const scriptDocument = {rootPath: path.join(cwd, 'src/__tests__/.tmp', 'scripted.xhtml')}
const svgDocument    = {rootPath: path.join(cwd, 'src/__tests__/.tmp', 'svg.xhtml')}

describe('ManifestItemProperties', () => {
    before(done =>
        fs.mkdirp(path.join(cwd, 'src/__tests__/.tmp'), (err) => {
            if (err) throw err
            done()
        })
    )

    describe('#isHTML', () => {
        it('Tests if a document is an (X)HTML file', done =>
            fs.writeFile(htmlFileObject.rootPath, '', (err) => {
                if (err) throw err
                ManifestItemProperties.isHTML(htmlFileObject).should.be.true
                fs.unlinkSync(htmlFileObject.rootPath)
                done()
            })
        )
    })

    describe('#isNav', () => {
        it('Tests if a document is an Epub navigation document', done =>
            fs.writeFile(navDocument.rootPath, '', (err) => {
                if (err) throw err
                ManifestItemProperties.isNav(navDocument).should.be.true
                fs.unlinkSync(navDocument.rootPath)
                done()
            })
        )
    })

    describe('#isScripted', () => {
        it('Tests if a document contains a script element', done =>
            fs.writeFile(scriptDocument.rootPath, '<script></script>', (err) => {
                if (err) throw err
                ManifestItemProperties.isScripted(scriptDocument).should.be.true
                fs.unlinkSync(scriptDocument.rootPath)
                done()
            })
        )
    })

    describe('#isSVG', () => {
        it('Tests if a document contains an SVG element', done =>
            fs.writeFile(svgDocument.rootPath, '<svg></svg>', (err) => {
                if (err) throw err
                ManifestItemProperties.isSVG(svgDocument).should.be.true
                fs.unlinkSync(svgDocument.rootPath)
                done()
            })
        )
    })

    describe('#isDCElement', () => {
        it('Tests if the term property of an object exists in the dc/elements object')
    })

    describe('#isDCTerm', () => {
        it('Tests if the term property of an object exists in the dc/terms object')
    })

    describe('#testHTML', () => {
        it('Tests if a document contains a script or SVG element, and if it is an Epub navigation document') // eslint-disable-line max-len
    })

    describe('#testMeta', () => {
        it('Returns an object with tested term and element properties values')
    })
})
