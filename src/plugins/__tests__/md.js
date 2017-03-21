
// npm run -s mocha:single -- ./src/plugins/__tests__/md.js

/**
 * General tests for the `module:md:MarkIt` class for error handling and basic
 * functionality. More detailed tests for the output of each of the directives
 * can be found in ./src/plugins/md/directives/__tests__/directives.js
 */

/* eslint-disable max-len, import/no-extraneous-dependencies */

const chai = require('chai').should() // eslint-disable-line no-unused-vars
const sinon = require('sinon')
const MarkdownIt = require('markdown-it')
const loader = require('../../lib/loader').default
const store = require('../../lib/store').default
const MarkIt = require('../md').default
const utils = require('../../utils')

const Logger = require('../../__tests__/helpers/console')

describe('module:md:MarkIt', () => {
  let logger
  let markit

  before(() => {
    loader(() => ({}))
    logger = new Logger()
    return logger
  })

  beforeEach(() => {
    logger.reset()
    store.update('build', 'epub')
    store.update('pages', [])
    markit = new MarkIt()
    return markit
  })

  describe('#constructor', () => {
    it('Should load user defined `markdown-it` plugins')

    it('Creates a new instance of the MarkIt class', () => {
      markit.should.be.an('object')
      markit.md.should.be.an.instanceOf(MarkdownIt)
      markit.nestedStrings.should.be.an('array')
      markit.nestedStrings.should.have.length(0)
      markit.filename.should.equal('')
    })
  })

  describe('#render', () => {
    it('Should transform a Markdown string to HTML', () => {
      markit.render('test', '# Test').should.equal('<h1>Test</h1>\n')
    })

    it('Should log a console error if a directive is malformed', () => {
      markit.render('test', '::: section malformed')
      markit.render('test', '::: epigraph malformed')
      markit.render('test', '::: pull-quote malformed')
      markit.render('test', '::: image malformed')

      logger.errors.should.have.length(4)
      logger.errors[0].message.should.match(/<section> Malformed directive/)
      logger.errors[1].message.should.match(/<epigraph> Malformed directive/)
      logger.errors[2].message.should.match(/<pull-quote> Malformed directive/)
      // logger.errors[3].message.should.match(/<image> Malformed directive/)
    })

    it('Should accept Epub type container directives')
    it('Should validate directive\'s attributes')
    it('Should render a directive\'s attributes as valid HTML attributes')

    it('Should execute `MarkIt#postRenderCallback` after the HTML has been rendered', () => {
      const callback = sinon.spy(markit, 'postRenderCallback')
      const params = markit.render('test', '# Test')
      sinon.assert.calledWith(callback, params)
    })

    it('Should update the global store with a Markdown file\'s frontmatter', () => {
      const callback = sinon.spy(utils, 'updateStore')
      markit.render('test', '--- foo: bar\n# Test')
      sinon.assert.calledOnce(callback)
      store.pages.should.be.an('array')
      store.pages[0].filename.should.equal('test')
      store.pages[0].should.have.property('foo')
    })
  })

  describe('#section', () => {
    it('Should include a `section` directive', () => {
      markit.md.renderer.rules.should.have.property('container_section_open')
      markit.md.renderer.rules.should.have.property('container_section_close')
      markit.md.renderer.rules.container_section_open.should.be.a('function')
      markit.md.renderer.rules.container_section_close.should.be.a('function')
    })

    it('Should render Epub type containers as `section` elements')

    it('Should render a `section` directive', () => {
      // TODO: move this to directives testing
      markit.render('test', '::: section "chapter" "Test"').should.equal('<section epub:type="chapter" title="Test" class="chapter">\n')
    })

    it('Should output a default element if a `section` directive is malformed', () => {
      markit.render('test', '::: section malformed').should.equal('<section>')
      logger.errors.should.have.length(1)
      logger.errors[0].message.should.match(/<section> Malformed directive/)
    })
  })

  describe('#image', () => {
    it('Should log a console warning if an image is not found')//, () => {
      // MarkIt.render('test', '::: image src:foo.jpg')
      // logger.warnings.should.have.length(1)
      // logger.warnings[0].message.should.match(/<img> `_images/foo.jpg` not found/)
    //})
  })

  describe('#exit', () => {
    it('Should close a container directive when the corresponding `exit` directive is encountered')
  })
})
