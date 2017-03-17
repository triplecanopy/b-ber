
require('chai').should()
const path = require('path')
const fs = require('fs-extra')
const Props = require('../modules/props').default

const cwd = process.cwd()

describe('Props', () => {
  const htmlFileObject = { rootPath: path.join(cwd, 'src/__tests__', 'file.xhtml') }
  const navDocument = { rootPath: path.join(cwd, 'src/__tests__', 'toc.xhtml'), name: 'toc.xhtml' }
  const scriptDocument = { rootPath: path.join(cwd, 'src/__tests__', 'scripted.xhtml') }
  const svgDocument = { rootPath: path.join(cwd, 'src/__tests__', 'svg.xhtml') }

  before(() => {
    fs.writeFileSync(htmlFileObject.rootPath, '')
    fs.writeFileSync(navDocument.rootPath, '')
    fs.writeFileSync(scriptDocument.rootPath, '<script></script>')
    fs.writeFileSync(svgDocument.rootPath, '<svg></svg>')
  })
  after(() => {
    fs.unlink(htmlFileObject.rootPath)
    fs.unlink(navDocument.rootPath)
    fs.unlink(scriptDocument.rootPath)
    fs.unlink(svgDocument.rootPath)
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
