'use strict'

// npm run -s mocha:single -- ./src/bber-plugins/__tests__/md.js

/**
 * General `module:md:MarkdownRenderer` class tests for error handling and basic
 * functionality. More detailed tests for the output of each of the directives
 * can be found in ./src/plugins/md/directives/__tests__/directives.js
 */

/* eslint-disable max-len, import/no-extraneous-dependencies */

const chai = require('chai').should() // eslint-disable-line no-unused-vars
const sinon = require('sinon')
const MarkdownIt = require('markdown-it')
const store = require('../../bber-lib/store').default
const MarkdownRenderer = require('../md').default
const logger = require('../../__tests__/helpers/console')

describe('module:md:MarkdownRenderer', () => {
    let markdownRenderer

    beforeEach((done) => {
        logger.reset()
        store.update('build', 'epub')
        store.update('pages', [])
        markdownRenderer = new MarkdownRenderer()
        return done()
    })

    describe('#constructor', () => {
        it('Should load user defined `markdown-it` plugins')

        it('Creates a new instance of the MarkdownRenderer class', () => {
            markdownRenderer.should.be.an('object')
            markdownRenderer.md.should.be.an.instanceOf(MarkdownIt)
            markdownRenderer.filename.should.equal('')
        })
    })

    describe('#render', () => {
        it('Should transform a Markdown string to HTML', () => {
            markdownRenderer.render('test', '# Test').should.equal('<h1>Test</h1>\n')
        })

        it('Should throw an error if an invalid directive is used')

        it('Should update the global store with a Markdown file\'s frontmatter', () => {
            const callback = sinon.spy(store, 'add')
            markdownRenderer.render('test', '--- foo: bar\n# Test')
            sinon.assert.calledOnce(callback)
            store.pages.should.be.an('array')
            store.pages[0].filename.should.equal('test')
            store.pages[0].should.have.property('foo')
        })
    })

    describe('#section', () => {
        it('Should include a `section` directive', () => {
            markdownRenderer.md.renderer.rules.should.include.all.keys('container_section_open', 'container_section_close')
        })
    })

    describe('#dialogue', () => {
        it('Should include a `dialogue` directive', () => {
            markdownRenderer.md.renderer.rules.should.include.all.keys('container_dialogue_open', 'container_dialogue_close')
        })
    })

    describe('#image', () => {
        it('Should include an `image` directive')//, () => {
        //     markdownRenderer.md.renderer.rules.should.include.key('container_image_open')
        // })
    })

    describe('#logo', () => {
        it('Should include a `logo` directive')//, () => {
        //   markdownRenderer.md.renderer.rules.should.include.key('container_logo_open')
        // })
    })

    describe('#pullquote', () => {
        it('Should include an `pullquote` directive', () => {
            markdownRenderer.md.renderer.rules.should.include.all.keys('container_pullQuote_open', 'container_pullQuote_close')
        })
    })
})
