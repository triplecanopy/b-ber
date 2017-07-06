'use strict'

// npm run -s mocha:single -- ./src/bber-plugins/md/directives/__tests__/directives.js

/* eslint-disable no-unused-vars, no-multi-spaces, import/newline-after-import, max-len */

const fs = require('fs-extra')
const path = require('path')
const _ = require('lodash')
const chai = require('chai').should() // eslint-disable-line no-unused-vars
const store = require('../../../../bber-lib/store').default
const utils = require('../../../../bber-utils')

const entries = utils.entries
const src = utils.src

// plugins
const pluginDialogue  = require('../dialogue').default
const pluginEpigraph  = require('../epigraph').default
const pluginImage     = require('../image').default
// const pluginLogo   = require('../logo').default
const pluginPullQuote = require('../pull-quote').default
const pluginSection   = require('../section').default

// directive utils
const helpers          = require('../helpers')
const attributes       = helpers.attributes
const htmlId           = helpers.htmlId

// directive constants
const directives                         = require('../../../../bber-shapes/directives')
const BLOCK_DIRECTIVE_MARKER             = directives.BLOCK_DIRECTIVE_MARKER
const INLINE_DIRECTIVE_MARKER            = directives.INLINE_DIRECTIVE_MARKER
const BLOCK_DIRECTIVE_FENCE              = directives.BLOCK_DIRECTIVE_FENCE
const INLINE_DIRECTIVE_FENCE             = directives.INLINE_DIRECTIVE_FENCE
const BLOCK_DIRECTIVE_MARKER_MIN_LENGTH  = directives.BLOCK_DIRECTIVE_MARKER_MIN_LENGTH
const INLINE_DIRECTIVE_MARKER_MIN_LENGTH = directives.INLINE_DIRECTIVE_MARKER_MIN_LENGTH
const FRONTMATTER_DIRECTIVES             = directives.FRONTMATTER_DIRECTIVES
const BODYMATTER_DIRECTIVES              = directives.BODYMATTER_DIRECTIVES
const BACKMATTER_DIRECTIVES              = directives.BACKMATTER_DIRECTIVES
const BLOCK_DIRECTIVES                   = directives.BLOCK_DIRECTIVES
const INLINE_DIRECTIVES                  = directives.INLINE_DIRECTIVES
const GLOBAL_ATTRIBUTES                  = directives.GLOBAL_ATTRIBUTES
const DIRECTIVE_ATTRIBUTES               = directives.DIRECTIVE_ATTRIBUTES

// test helpers
const Logger = require('../../../../__tests__/helpers/console')
const Md = require('./helpers/markit-mock').default

describe('md:directive', () => {
  let logger
  before((done) => {
    logger = new Logger()
    const imageData = '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'
    const imageBuffer = new Buffer(imageData, 'base64')
    const imageDir = path.join(src(), '_images')
    const imagePath = path.join(imageDir, 'foo.jpg')
    return fs.mkdirs(imageDir, (err0) => {
      if (err0) { throw err0 }
      return fs.writeFile(imagePath, imageBuffer, (err1) => {
        if (err1) { throw err1 }
        return done()
      })
    })
  })

  after(done => fs.remove(src(), (err) => {
    if (err) { throw err }
    done()
  }))

  let md
  beforeEach((done) => {
    logger.reset()
    md = new Md()
    done()
  })

  // general
  it('Should throw an error if the required attributes are not present', () => {
    md.load(pluginSection)
    const result = BLOCK_DIRECTIVES.map(d => md.parser.render(`${BLOCK_DIRECTIVE_FENCE}${d}`))
    return logger.errors.should.have.length(result.length)
  })

  it('Should ensure the directive\'s [id] attribute is converted to a valid HTML id', (done) => {
    htmlId(1).should.equal('_1')
    htmlId('foo bar').should.equal('_foo_bar')
    return done()
  })

  it('Should add classes to the HTML output based on directive name and type', (done) => {
    md.load(pluginSection)
    const id = 'foo'
    const attrs = 'classes:"foo bar baz"'
    FRONTMATTER_DIRECTIVES.map((d) => {
      store.reset()
      const classAttr = `class="foo bar baz frontmatter ${d}"`
      return md.parser.render(`${BLOCK_DIRECTIVE_FENCE}${d}:${id} ${attrs}`)
      .should.contain(classAttr)
    }).should.not.contain(false)

    BODYMATTER_DIRECTIVES.map((d) => {
      store.reset()
      const classAttr = `class="foo bar baz bodymatter ${d}"`
      return md.parser.render(`${BLOCK_DIRECTIVE_FENCE}${d}:${id} ${attrs}`)
      .should.contain(classAttr)
    }).should.not.contain(false)

    BACKMATTER_DIRECTIVES.map((d) => {
      store.reset()
      const classAttr = `class="foo bar baz backmatter ${d}"`
      return md.parser.render(`${BLOCK_DIRECTIVE_FENCE}${d}:${id} ${attrs}`)
      .should.contain(classAttr)
    }).should.not.contain(false)

    return done()
  })

  it('Should add the proper attributes to the HTML output', () => {
    const id = 'foo'
    md.load(pluginImage)
    md.load(pluginSection)

    const directiveAttributes = Object.assign({}, DIRECTIVE_ATTRIBUTES)
    delete directiveAttributes.misc // handle misc (pull-quote, dialogue, epigraph, etc) separately

    const dirs = Object.assign({}, directiveAttributes)
    const tmpl = Object.assign({}, dirs.section)
    const sections = [...BLOCK_DIRECTIVES]
    delete dirs.section

    for (let i = 0; i < sections.length; i++) {
      dirs[sections[i]] = tmpl
    }

    // for documentation
    //
    // let current = ''

    for (const [k, v] of entries(dirs)) {
      const __v = Object.assign({}, v.optional)

      const requiredArr = []
      for (const [rk, rv] of entries(v.required)) { requiredArr.push(rv.input) }
      const required = requiredArr.join(' ')

      for (const [_k, _v] of entries(__v)) {
        store.reset()
        const attr = _.isArray(_v) ? _v[0] : _v
        const test = attr.output.constructor === RegExp ? attr.output : new RegExp(attr.output)
        const open = `${BLOCK_DIRECTIVE_FENCE}${k}:${id} ${required} ${attr.input}`
        const body = sections.indexOf(k) > -1 ? 'foo' : ''
        const close = sections.indexOf(k) > -1 ? `${BLOCK_DIRECTIVE_FENCE} exit:${id}` : ''
        const mdStr = `${open}\n${body}\n${close}`

        // following can be used to generate documentation
        //

        // console.log()
        // if (current !== k) {
        //   current = k
        //   console.log(`## Directive: \`${current}\``)
        // }
        // console.log()
        // console.log(`### Attribute: \`${_k}\`\n`)
        // console.log('#### Input\n')
        // console.log()
        // console.log('```')
        // console.log(mdStr)
        // console.log('```')
        // console.log()
        // console.log('#### Output\n')
        // console.log()
        // console.log('```')
        // console.log(md.parser.render(mdStr))
        // console.log('```')
        // console.log()

        md.parser.render(mdStr).should.match(test)
      }
    }
  })

  describe(':container', () => {
    it('Should interpret container types as generic container directives', () => {
      md.load(pluginSection)
      const id = 'foo'
      const re = /<section/
      return FRONTMATTER_DIRECTIVES.map((d) => {
        store.reset()
        return md.parser.render(`${BLOCK_DIRECTIVE_FENCE}${d}:${id}`).should.match(re)
      }).should.not.contain(false)
    })

    it('Should nest containers with the appropriate closing tags', (done) => {
      md.load(pluginSection)
      const id = 'foo'
      const nestedMdPath = path.join(__dirname, 'strings/section-nested.md')
      return fs.readFile(nestedMdPath, 'utf8', (err, data) => {
        if (err) { throw err }

        const html = md.parser.render(data)
        const matches = html.match(/(?:START:\s[^\s]+#_([^\s]+)|END:\s[^\s]+#_([^\s]+))/g)

        matches.should.be.an('array')
        matches[0].should.equal('START: section:chapter#_outer;')
        matches[1].should.equal('START: section:chapter#_inner;')
        matches[2].should.equal('END: section:exit#_inner')
        matches[3].should.equal('END: section:exit#_outer')
        done()
      })
    })

    // misc. directive tests
    it('Should render a pull-quote directive', () => {
      md.load(pluginPullQuote)
      const pq = DIRECTIVE_ATTRIBUTES.misc['pull-quote']
      const requiredAttrs = pq.required

      let required = ''
      for (const [rk, rv] of entries(requiredAttrs)) {
        required += ` ${rv.input}`
      }

      const optional = pq.optional
      for (const [k, v] of entries(optional)) {
        store.reset()
        const input = `::: pull-quote:foo ${required} ${v.input}\n\nfoo\n\n::: exit:foo`
        const output = md.parser.render(input)
        output.should.match(v.output)
      }
    })

    it('Should render an epigraph directive')//, () => {
    //   md.load(pluginEpigraph)
    //   const ep = DIRECTIVE_ATTRIBUTES.misc['epigraph']
    //   const requiredAttrs = ep.required

    //   let required = ''
    //   for (const [rk, rv] of entries(requiredAttrs)) {
    //     required += ` ${rv.input}`
    //   }

    //   const optional = ep.optional
    //   for (const [k, v] of entries(optional)) {
    //     const input = `::: epigraph:foo ${required} ${v.input}\nfoo\n::: exit:foo`
    //     const output = md.parser.render(input)
    //   }
    // })

    it('Should render a dialogue directive', () => {
      store.reset()
      md.load(pluginDialogue)
      const di = DIRECTIVE_ATTRIBUTES.misc.dialogue
      const requiredAttrs = di.required

      let required = ''
      for (const [rk, rv] of entries(requiredAttrs)) {
        required += ` ${rv.input}`
      }

      const optional = di.optional
      for (const [k, v] of entries(optional)) {
        const input = `::: dialogue:foo ${required} ${v.input}\nfoo\n::: exit:foo`
        const output = md.parser.render(input)
      }
    })
  })

  describe(':image', () => {
    beforeEach(() => {
      md.load(pluginImage)
      store.reset()
    })

    it('Logs an error if an image does not exist', () => {
      const html = md.parser.render(`${INLINE_DIRECTIVE_FENCE}image:bar source:bar.jpg`)
      html.should.match(/Image not found/)
      logger.errors.should.have.length(1)
    })

    it('Renders without an exit directive', () => {
      const html = md.parser.render(`${INLINE_DIRECTIVE_FENCE}image:foo source:foo.jpg`)
      html.should.match(/<!-- START: image:image#_foo;/)
    })

    it('Renders a caption only if the attribute is exited', () => {
      let str = ''
      str += `${INLINE_DIRECTIVE_FENCE}image:foo source:foo.jpg`
      str += '\n\nbar\n\n\nsome more stuff'
      // str += '\n\n::: exit:foo'
      const html = md.parser.render(str)
      console.log(str)
      console.log(store.images[0])
      console.log(html)
    })

    it('Renders an image without the caption text', () => {
      let str = ''
      str += `${INLINE_DIRECTIVE_FENCE}image:foo source:foo.jpg`
      str += '\n\n:: bar'
      str += '\n\n::: exit:foo'
      const html = md.parser.render(str).split('\n')
      html.should.have.length(9)
      html[1].should.match(/<!-- START: image:image#_foo; _markdown\/undefined.md:0 -->/)
      html[5].should.match(/^\s+<img src="..\/images\/foo.jpg" alt="foo.jpg"\/>/)
      html[8].should.match(/^\s+<\/div>/)
    })

    it('Saves captions in the global store', () => {
      const captionText = ' bar\n\n'
      let str = ''
      str += `${INLINE_DIRECTIVE_FENCE}image:foo source:foo.jpg\n\n`
      str += `::${captionText}`
      str += '::: exit:foo'
      md.parser.render(str)
      store.images[0].caption.should.equal(captionText)
    })
  })

  describe(':attribute', () => {
    it('Should fallback to default attributes if invalid attributes are provided', () => {
      attributes(' bogus:true', 'chapter').should.equal(' epub:type="bodymatter chapter" class="bodymatter chapter"')
    })
    it('Should fallback to default attributes if none are provided', () => {
      attributes('', 'chapter').should.equal(' epub:type="bodymatter chapter" class="bodymatter chapter"')
    })
    it('Should log a warning to the console if an unsupported attribute is used', () => {
      attributes(' classes:"foo" bogus:true', 'chapter')
      logger.warnings.should.have.length(1)
      logger.warnings[0].message.should.match(/Removing illegal/)
    })
  })
})
