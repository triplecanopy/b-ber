
// npm run -s mocha:single -- ./src/plugins/md/directives/__tests__/directives.js

const chai = require('chai').should() // eslint-disable-line no-unused-vars
// const sinon = require('sinon')
const MarkdownIt = require('markdown-it')
const loader = require('../../../../lib/loader').default
const store = require('../../../../lib/store').default
// const MarkIt = require('../../../md').default
// const utils = require('../../../../utils')

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
