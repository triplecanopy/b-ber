'use strict'

// npm run -s mocha:single -- ./src/bber-plugins/md/directives/__tests__/directives.js

const chai = require('chai').should() // eslint-disable-line no-unused-vars
// const sinon = require('sinon')
const MarkdownIt = require('markdown-it')
const loader = require('../../../../bber-lib/loader').default
const store = require('../../../../bber-lib/store').default
// const MarkIt = require('../../../md').default
// const utils = require('../../../../bber-utils')

// plugins
const pluginDialogue = require('../dialogue').default
const pluginEpigraph = require('../epigraph').default
const pluginExit = require('../exit').default
const pluginImages = require('../images').default
const pluginLogo = require('../logo').default
const pluginPullQuote = require('../pull-quote').default
const pluginSection = require('../section').default

// helpers
const Logger = require('../../../../__tests__/helpers/console')

class Md {
  constructor() {
    this.parser = new MarkdownIt({
      html: true,
      xhtmlOut: true,
      breaks: false,
      linkify: false
    })
  }

  _set(key, val) {
    this[key] = val
    return this[key]
  }

  _get(key) {
    return this[key]
  }

  load(plugin) {
    this.parser.use(
      plugin.plugin,
      plugin.name,
      plugin.renderer(this.parser, this)
    )
  }
}

describe('md:directives', () => {
  let logger
  before(() => {
    logger = new Logger()
  })

  let md
  beforeEach(() => {
    logger.reset()
    store.update('build', 'epub')
    md = new Md()
    return md
  })

  describe(':exit', () => {
    it('Should close a `section` element', () => {
      md.load(pluginExit)
      const str = '::: exit'
      md.parser.render(str).should.equal('</section>\n')
    })
  })

  describe(':epigraph', () => {
    it('Should render an `epigraph` component', () => {
      md.load(pluginEpigraph)
      const str = '::: epigraph image "foo"'
      md.parser.render(str).should.match(/<section epub:type="epigraph"/)
    })
  })

  describe(':dialogue', () => {
    it('Should render an `dialogue` component')//, () => {
      //md.load(pluginDialogue)
      //const str = ''
      //md.parser.render(str).should.equal('')
    //})
  })

  describe(':images', () => {
    it('Should render an `image` component', () => {
      md.load(pluginImages)
      const str = '::: image url "foo.jpg"'
      const out = md.parser.render(str)
      // md.parser.render(str).should.match(/<figure.*<img src="foo/)
    })
  })

  describe(':logo', () => {
    it('Should render a `logo` component')//, () => {
      //md.load(pluginLogo)
      //const str = ''
      //md.parser.render(str).should.equal('')
    //})
  })

  describe(':pullQuote', () => {
    it('Should render a `pull-quote` component')//, () => {
      //md.load(pluginPullQuote)
      //const str = ''
      //md.parser.render(str).should.equal('')
    //})
  })

  describe(':section', () => {
    it('Should render a `section` component')//, () => {
      //md.load(pluginSection)
      //const str = ''
      //md.parser.render(str).should.equal('')
    //})
  })
})


 //   it('Should render a `section` directive', () => {
  //     // TODO: move this to directives testing
  //     markit.render('test', '::: section "chapter" "Test"').should.equal('<section epub:type="chapter" title="Test" class="chapter">\n')
  //   })

  //   it('Should output a default element if a `section` directive is malformed', () => {
  //     markit.render('test', '::: section malformed').should.equal('<section>')
  //     logger.errors.should.have.length(1)
  //     logger.errors[0].message.should.match(/<section> Malformed directive/)
  //   })
  // })

  // describe('#image', () => {
  //   it('Should log a console warning if an image is not found')//, () => {
  //     // MarkIt.render('test', '::: image src:foo.jpg')
  //     // logger.warnings.should.have.length(1)
  //     // logger.warnings[0].message.should.match(/<img> `_images/foo.jpg` not found/)
  //   //})
  // })

  // describe('#exit', () => {
  //   it('Should close a container directive when the corresponding `exit` directive is encountered')
  // })


// it('Should validate directive\'s attributes')
    // it('Should render a directive\'s attributes as valid HTML attributes')
    // // it('Should log a console error if a directive is malformed', () => {
    //   markit.render('test', '::: section malformed')
    //   markit.render('test', '::: epigraph malformed')
    //   markit.render('test', '::: pull-quote malformed')
    //   markit.render('test', '::: image malformed')

    //   logger.errors.should.have.length(4)
    //   logger.errors[0].message.should.match(/<section> Malformed directive/)
    //   logger.errors[1].message.should.match(/<epigraph> Malformed directive/)
    //   logger.errors[2].message.should.match(/<pull-quote> Malformed directive/)
    //   // logger.errors[3].message.should.match(/<image> Malformed directive/)
    // })
