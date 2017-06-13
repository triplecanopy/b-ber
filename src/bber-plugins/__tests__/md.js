'use strict'

// npm run -s mocha:single -- ./src/bber-plugins/__tests__/md.js

/**
 * General `module:md:MarkIt` class tests for error handling and basic
 * functionality. More detailed tests for the output of each of the directives
 * can be found in ./src/plugins/md/directives/__tests__/directives.js
 */

/* eslint-disable max-len, import/no-extraneous-dependencies */

const chai = require('chai').should() // eslint-disable-line no-unused-vars
const sinon = require('sinon')
const MarkdownIt = require('markdown-it')
const loader = require('../../bber-lib/loader').default
const store = require('../../bber-lib/store').default
const MarkIt = require('../md').default

const Logger = require('../../__tests__/helpers/console')

describe('module:md:MarkIt', () => {
  let logger
  let markit

  before((done) => {
    loader(() => ({}))
    logger = new Logger()
    return done()
  })

  beforeEach((done) => {
    logger.reset()
    store.update('build', 'epub')
    store.update('pages', [])
    markit = new MarkIt()
    return done()
  })

  describe('#constructor', () => {
    it('Should load user defined `markdown-it` plugins')

    it('Creates a new instance of the MarkIt class', () => {
      markit.should.be.an('object')
      markit.md.should.be.an.instanceOf(MarkdownIt)
      markit.filename.should.equal('')
    })
  })

  describe('#render', () => {
    it('Should transform a Markdown string to HTML', () => {
      markit.render('test', '# Test').should.equal('<h1>Test</h1>\n')
    })

    it('Should throw an error if an invalid directive is used')

    it('Should execute `MarkIt#postRenderCallback` after the HTML has been rendered', () => {
      const callback = sinon.spy(markit, 'postRenderCallback')
      const params = markit.render('test', '# Test')
      sinon.assert.calledWith(callback, params)
    })

    it('Should update the global store with a Markdown file\'s frontmatter', () => {
      const callback = sinon.spy(store, 'add')
      markit.render('test', '--- foo: bar\n# Test')
      sinon.assert.calledOnce(callback)
      store.pages.should.be.an('array')
      store.pages[0].filename.should.equal('test')
      store.pages[0].should.have.property('foo')
    })
  })

  describe('#section', () => {
    it('Should include a `section` directive', () => {
      markit.md.renderer.rules.should.include.all.keys('container_section_open', 'container_section_close')
    })
  })

  describe('#dialogue', () => {
    it('Should include a `dialogue` directive', () => {
      markit.md.renderer.rules.should.include.all.keys('container_dialogue_open', 'container_dialogue_close')
    })
  })

  describe('#image', () => {
    it('Should include an `image` directive', () => {
      markit.md.renderer.rules.should.include.key('container_image_open')
    })
  })

  describe('#logo', () => {
    it('Should include a `logo` directive')//, () => {
    //   markit.md.renderer.rules.should.include.key('container_logo_open')
    // })
  })

  describe('#pull-quote', () => {
    it('Should include an `pull-quote` directive', () => {
      markit.md.renderer.rules.should.include.all.keys('container_pullQuote_open', 'container_pullQuote_close')
    })
  })
})
