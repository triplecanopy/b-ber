
/* eslint-disable max-len, import/no-extraneous-dependencies */

const chai = require('chai').should() // eslint-disable-line no-unused-vars
const sinon = require('sinon')
const bunyan = require('bunyan')
const MarkdownIt = require('markdown-it')
const loader = require('../loader').default
const actions = require('../state').default
const MarkIt = require('../tasks/md').default
const store = require('../state/store').default
const utils = require('../utils')

describe('module:md:MarkIt', () => {
  let consoleErrors = []
  let consoleWarnings = []

  before(() => {
    loader(config => actions.setBber({ build: 'epub' }))

    // send bunyan logging to arrays to validate in describe blocks
    bunyan.prototype.error = function(message) {
      consoleErrors.push({ message })
    }
    bunyan.prototype.warn = function(message) {
      consoleWarnings.push({ message })
    }
  })

  // clear application errors
  beforeEach(() => {
    consoleErrors = []
    consoleWarnings = []
  })

  describe('#constructor', () => {

    it('Should load user defined `markdown-it` plugins')

    it('Creates a new instance of the MarkIt class', () => {
      MarkIt.should.be.an('object')
      MarkIt.md.should.be.an.instanceOf(MarkdownIt)
      MarkIt.nestedStrings.should.be.an('array')
      MarkIt.nestedStrings.should.have.length(0)
      MarkIt.filename.should.equal('')
    })
  })

  describe('#render', () => {
    it('Should transform a Markdown string to HTML', () => {
      MarkIt.render('test', '# Test').should.equal('<h1>Test</h1>\n')
    })

    it('Should log a console error if a directive is malformed', () => {
      MarkIt.render('test', '::: section malformed')
      MarkIt.render('test', '::: epigraph malformed')
      MarkIt.render('test', '::: pull-quote malformed')
      MarkIt.render('test', '::: image malformed')

      consoleErrors.should.have.length(4)
      consoleErrors[0].message.should.match(/<section> Malformed directive/)
      consoleErrors[1].message.should.match(/<epigraph> Malformed directive/)
      consoleErrors[2].message.should.match(/<pull-quote> Malformed directive/)
      // consoleErrors[3].message.should.match(/<image> Malformed directive/)
    })

    it('Should accept Epub type container directives')
    it('Should validate directive\'s attributes')
    it('Should render a directive\'s attributes as valid HTML attributes')

    it('Should execute `MarkIt#postRenderCallback` after the HTML has been rendered', () => {
      const callback = sinon.spy(MarkIt, 'postRenderCallback')
      const params = MarkIt.render('test', '# Test')
      sinon.assert.calledWith(callback, params)
    })

    it('Should update the global store with a Markdown file\'s frontmatter', () => {
      const callback = sinon.spy(utils, 'updateStore')
      MarkIt.render('test', '--- foo: bar\n# Test')
      sinon.assert.calledOnce(callback)
      store.pages.should.be.an('array')
      store.pages[0].filename.should.equal('test')
      store.pages[0].should.have.property('foo')
    })
  })

  describe('#section', () => {
    it('Should include a `section` directive', () => {
      MarkIt.md.renderer.rules.should.have.property('container_section_open')
      MarkIt.md.renderer.rules.should.have.property('container_section_close')
      MarkIt.md.renderer.rules.container_section_open.should.be.a('function')
      MarkIt.md.renderer.rules.container_section_close.should.be.a('function')
    })

    it('Should render Epub type containers as `section` elements')

    it('Should render a `section` directive', () => {
      MarkIt.render('test', '::: section "chapter" "Test"').should.equal('<section epub:type="chapter" title="Test" class="chapter">\n')
    })

    it('Should output a default element if a `section` directive is malformed', () => {
      MarkIt.render('test', '::: section malformed').should.equal('<section>')
      consoleErrors.should.have.length(1)
      consoleErrors[0].message.should.match(/<section> Malformed directive/)
    })
  })

  describe('#image', () => {
    it('Should log a console warning if an image is not found')//, () => {
      // MarkIt.render('test', '::: image src:foo.jpg')
      // consoleWarnings.should.have.length(1)
      // consoleWarnings[0].message.should.match(/<img> `_images/foo.jpg` not found/)
    //})
  })

  describe('#exit', () => {
    it('Should close a container directive when the corresponding `exit` directive is encountered')
  })

})
