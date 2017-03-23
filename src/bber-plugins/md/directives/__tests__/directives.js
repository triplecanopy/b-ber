'use strict'

// npm run -s mocha:single -- ./src/bber-plugins/md/directives/__tests__/directives.js

/* eslint-disable no-unused-vars, no-multi-spaces, import/newline-after-import */

const _ = require('lodash')
const chai = require('chai').should() // eslint-disable-line no-unused-vars
// const sinon = require('sinon')
// const loader = require('../../../../bber-lib/loader').default
const store = require('../../../../bber-lib/store').default
// const utils = require('../../../../bber-utils')

// plugins
// const pluginDialogue = require('../dialogue').default
// const pluginEpigraph = require('../epigraph').default
// const pluginExit = require('../exit').default
// const pluginImages = require('../images').default
// const pluginLogo = require('../logo').default
// const pluginPullQuote = require('../pull-quote').default
const pluginSection = require('../section').default

// directive utils
const helpers          = require('../helpers')
const directiveBody    = helpers.directiveBody
const extractAttrs     = helpers.extractAttrs
const buildAttrArray   = helpers.buildAttrArray
const stringToCharCode = helpers.stringToCharCode
const isValidAttr      = helpers.isValidAttr
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
const MISC_DIRECTIVES                    = directives.MISC_DIRECTIVES


// test helpers
const Logger = require('../../../../__tests__/helpers/console')
const Md = require('./helpers/markit-mock').default

// directive source
// const DIRECTIVE_STRINGS = require('../')

const GLOBAL_REQUIRES = ['id']

// { `<directive-name>: <String|Array>` }
const DIRECTIVE_REQUIRES = {
  image: 'source',
  'inline-image': 'source',
  video: 'source',
  audio: 'source'
}

// <attribute-name>: { input: output }
const DIRECTIVE_ATTRIBUTES = {
  title: {
    input: 'title:"foo"',
    output: 'title="foo"'
  },
  classes: {
    input: 'classes:"foo bar baz"',
    output: 'class="foo bar baz"'
  },
  pagebreak: [{
    input: 'pagebreak:before',
    output: 'style="page-break-before:before"'
  }, {
    input: 'pagebreak:after',
    output: 'style="page-break-before:always"'
  }],

  // wildcard
  // attrs: { input: '',  output: '' },

  // image
  caption: {
    input: 'caption:"foo bar"',
    output: /<p class="caption">foo bar<\/p>/
  },
  alt: {
    input: 'alt:foo',
    output: 'alt="foo"'
  },

  // audio/video
  poster: {
    input: 'poster:foo.jpg',
    output: 'poster="foo.jpg"'
  },
  autoplay: {
    input: 'autoplay:yes',
    output: 'autoplay="autoplay"'
  },
  loop: {
    input: 'loop:yes',
    output: 'loop="loop"'
  },
  controls: {
    input: 'controls:yes',
    output: 'controls="controls"'
  },
  muted: {
    input: 'muted:yes',
    output: 'muted="muted"'
  },

  // pullquote
  citation: {
    input: 'citation:"foo bar"',
    output: /<cite>&#8212;&#160;foo bar<\/cite>/
  }
}

describe('md:directive', () => {
  let logger
  before((done) => {
    logger = new Logger()
    done()
  })

  let md
  beforeEach((done) => {
    logger.reset()
    store.update('build', 'epub')
    md = new Md()
    done()
  })


  // general
  it('Should throw an error if the required attributes are not present', () => {
    md.load(pluginSection)
    const allDirectives = _.union(
      FRONTMATTER_DIRECTIVES,
      BODYMATTER_DIRECTIVES,
      BACKMATTER_DIRECTIVES
    )
    const result = allDirectives.map(d => md.parser.render(`${BLOCK_DIRECTIVE_FENCE}${d}`))
    return logger.errors.should.have.length(result.length * 2) // directives + exits
  })

  it('Should ensure the directive\'s [id] attribute is converted to a valid HTML id', () => {
    htmlId(1).should.equal('_1')
    return htmlId('foo bar').should.equal('_foo_bar')
  })

  it('Should add classes to the HTML output based on directive name and type', () => {
    md.load(pluginSection)
    const id = 'foo'
    const attrs = 'classes:"foo bar baz" pagebreak:before'
    FRONTMATTER_DIRECTIVES.map((d) => {
      const classAttr = `class="foo bar baz frontmatter ${d}"`
      md.parser.render(`${BLOCK_DIRECTIVE_FENCE}${d}:${id} ${attrs}`).should.contain(classAttr)
    }).should.not.contain(false)

    BODYMATTER_DIRECTIVES.map((d) => {
      const classAttr = `class="foo bar baz bodymatter ${d}"`
      md.parser.render(`${BLOCK_DIRECTIVE_FENCE}${d}:${id} ${attrs}`).should.contain(classAttr)
    }).should.not.contain(false)

    BACKMATTER_DIRECTIVES.map((d) => {
      const classAttr = `class="foo bar baz backmatter ${d}"`
      md.parser.render(`${BLOCK_DIRECTIVE_FENCE}${d}:${id} ${attrs}`).should.contain(classAttr)
    }).should.not.contain(false)
  })
  it('Should add epub:type attributes to the HTML output based on directive name and type')

  describe(':element', () => {
    describe(':frontmatter', () => {
      it('Should interpret frontmatter types as generic container directives', () => {
        md.load(pluginSection)
        const id = 'foo'
        const re = /<section/
        return FRONTMATTER_DIRECTIVES.map(d =>
          md.parser.render(`${BLOCK_DIRECTIVE_FENCE}${d}:${id}`).should.match(re)
        ).should.not.contain(false)
      })
    })

    // describe(':exit', () => {
    //   it('Should close a `section` element', () => {
    //     md.load(pluginExit)
    //     const str = '::: exit'
    //     md.parser.render(str).should.equal('</section>\n')
    //   })
    // })

    // describe(':epigraph', () => {
    //   it('Should render an `epigraph` component', () => {
    //     md.load(pluginEpigraph)
    //     const str = '::: epigraph image "foo"'
    //     md.parser.render(str).should.match(/<section epub:type="epigraph"/)
    //   })
    // })

    // describe(':dialogue', () => {
    //   it('Should render an `dialogue` component')//, () => {
    //     //md.load(pluginDialogue)
    //     //const str = ''
    //     //md.parser.render(str).should.equal('')
    //   //})
    // })

    // describe(':images', () => {
    //   it('Should render an `image` component', () => {
    //     md.load(pluginImages)
    //     const str = '::: image url "foo.jpg"'
    //     const out = md.parser.render(str)
    //     // md.parser.render(str).should.match(/<figure.*<img src="foo/)
    //   })
    // })

    // describe(':logo', () => {
    //   it('Should render a `logo` component')//, () => {
    //     //md.load(pluginLogo)
    //     //const str = ''
    //     //md.parser.render(str).should.equal('')
    //   //})
    // })

    // describe(':pullQuote', () => {
    //   it('Should render a `pull-quote` component')//, () => {
    //     //md.load(pluginPullQuote)
    //     //const str = ''
    //     //md.parser.render(str).should.equal('')
    //   //})
    // })

    // describe(':section', () => {
    //   it('Should render a `section` component')//, () => {
    //     //md.load(pluginSection)
    //     //const str = ''
    //     //md.parser.render(str).should.equal('')
    //   //})
    // })
  })

  describe(':attribute', () => {
    it('Should extract the directive\'s attributes from the directive body')
    it('Should log warnings to the console if an unsupported attribute is used')
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
