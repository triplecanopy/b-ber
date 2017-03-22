
/* eslint-disable no-unused-expressions */

require('chai').should()
const path = require('path')
const fs = require('fs-extra')
const Props = require('../props').default

const cwd = process.cwd()

describe('Props', () => {
  let htmlFileObject
  let navDocument
  let scriptDocument
  let svgDocument

  before(() => {
    fs.mkdirp(path.join(cwd, 'src/__tests__/.tmp'), (err) => {
      if (err) { throw err }

      htmlFileObject = { rootPath: path.join(cwd, 'src/__tests__/.tmp', 'file.xhtml') }
      navDocument    = { rootPath: path.join(cwd, 'src/__tests__/.tmp', 'toc.xhtml'), name: 'toc.xhtml' }
      scriptDocument = { rootPath: path.join(cwd, 'src/__tests__/.tmp', 'scripted.xhtml') }
      svgDocument    = { rootPath: path.join(cwd, 'src/__tests__/.tmp', 'svg.xhtml') }

      fs.writeFileSync(htmlFileObject.rootPath, '')
      fs.writeFileSync(navDocument.rootPath, '')
      fs.writeFileSync(scriptDocument.rootPath, '<script></script>')
      fs.writeFileSync(svgDocument.rootPath, '<svg></svg>')
    })
  })
  after(() => {
    fs.unlink(htmlFileObject.rootPath)
    fs.unlink(navDocument.rootPath)
    fs.unlink(scriptDocument.rootPath)
    fs.unlink(svgDocument.rootPath)
    fs.remove(path.join(cwd, 'src/__tests__/.tmp'), (err) => {
      if (err) { throw err }
    })
  })


  describe('#isHTML', () => {
    it('Tests if a document is an (X)HTML file', () => {
      Props.isHTML(htmlFileObject).should.be.true
    })
  })

  describe('#isNav', () => {
    it('Tests if a document is an Epub navigation document', () => {
      Props.isNav(navDocument).should.be.true
    })
  })

  describe('#isScripted', () => {
    it('Tests if a document contains a script element', () => {
      Props.isScripted(scriptDocument).should.be.true
    })
  })

  describe('#isSVG', () => {
    it('Tests if a document contains an SVG element', () => {
      Props.isSVG(svgDocument).should.be.true
    })
  })

  describe('#isDCElement', () => {
    it('Tests if the term property of an object exists in the dc/elements object')
  })

  describe('#isDCTerm', () => {
    it('Tests if the term property of an object exists in the dc/terms object')
  })

  describe('#testHTML', () => {
    it('Tests if a document contains a script or SVG element, and if it is an Epub navigation document')
  })

  describe('#testMeta', () => {
    it('Returns an object with tested term and element properties values')
  })
})
