'use strict'

// npm run -s mocha:single -- ./src/bber-plugins/markdown/directives/__tests__/directives.js
// ./node_modules/.bin/mocha -R spec --compilers js:./node_modules/babel-register ./src/bber-plugins/markdown/directives/__tests__/directives.js

/* eslint-disable no-unused-vars, no-multi-spaces, import/newline-after-import, max-len */

const fs = require('fs-extra')
const path = require('path')
const _ = require('lodash')
const chai = require('chai').should() // eslint-disable-line no-unused-vars
const state = require('../../../../bber-lib/state').default
const utils = require('../../../../bber-utils')
const pretty = require('pretty')

const forOf = utils.forOf
const src = utils.src

// plugins
const pluginDialogue  = require('../dialogue').default
const pluginEpigraph  = require('../epigraph').default
const pluginImage     = require('../image').default
const pluginLogo      = require('../logo').default
const pluginMedia     = require('../media').default
const pluginPullQuote = require('../pullquote').default
const pluginSection   = require('../section').default

// directive utils
const helpers          = require('../helpers')
const attributes       = helpers.attributes
const htmlId           = helpers.htmlId

// directive constants
const directives                         = require('../../../../bber-shapes/directives')
const directiveSpec                      = require('../../../../bber-shapes/directives/spec').DIRECTIVE_SPEC
const figureTemplates                    = require('../../../../bber-templates/figures').default

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
const MISC_DIRECTIVES                    = directives.MISC_DIRECTIVES

const DIRECTIVE_ATTRIBUTES               = directives.DIRECTIVE_ATTRIBUTES

const ALL_DIRECTIVES                     = [...BLOCK_DIRECTIVES, ...INLINE_DIRECTIVES, ...MISC_DIRECTIVES]

// test helpers
const logger = require('../../../../__tests__/helpers/console')
const MarkdownRenderer = require('./helpers/markdown-renderer-mock').default


const stripComments = str => str.replace(/<!--.*?-->/g, '')

const prettify = str => pretty(stripComments(str), {ocd: true})

const documentationHeader = () => {
    let toc = '\n\n# List of Directives\n\n'
    forOf(directiveSpec, (name) => {
        const directive = directiveSpec[name]
        toc += `* [\`${name}\`](#${name})\n`
    })
    return toc
}

const wrapWithDocumentationFormatting = (directive) => {
    const required = directive.required.filter(o => Object.keys(o)[0] !== 'id') // remove `id` since we know it's globally required, and has irregular syntax
    const optional = (function() {
        const input = [...directive.optional]
        const output = []
        let curr
        while((curr = input.shift())) {
            if (_.findIndex(output, {name: curr.name}) < 0) {
                output.push(curr)
            }
        }
        return output
    })()

    return `
## \`${directive.name}\`

### Required Attributes

* \`id\`
${required.reduce((acc, curr) => acc.concat(`* \`${Object.keys(curr)[0]}\`\n`), '')}

### Optional Attributes

${!_.isEmpty(optional[0]) ? optional.reduce((acc, curr) => acc.concat(`* \`${curr.name}\`\n`), '') : '`nil`'}

### Directive Properties

<table>
<tr>
<td>Self-closing (does not require a matching <code>exit</code> directive)</td>
<td><code>${directive.selfClosing}</code></td>
</tr>
<tr>
<td>Accepts nested content</td>
<td><code>${!directive.selfClosing}</code></td>
</tr>
<tr>
<td>Creates additional XHTML files (e.g., adds files to the <code>loi</code>)</td>
<td><code>${!!(directive.supplementaryOutputRepository)}</code></td>
</tr>
</table>

### Syntax

\`\`\`md
${directive.example.basic.md}
\`\`\`

### Output

\`\`\`html
${prettify(directive.example.basic.html)}
\`\`\`

${ directive.generated.basic.html ? `

### Generated Output

This directive creates XHTML files which are inserted into the \`figures\` section of the publication. The generated markup is below.

\`\`\`html
${prettify(directive.generated.basic.html)}
\`\`\`

` : '' }

${ directive.example.variant.md ? `

### Variant Syntax

This directive supports an extended syntax that tokenizes supplemental content.

In the case of figures, for example, a caption can be added by wrapping a line of text with two colons (\`::\`) immediately following the \`figure\` directive.  See example below for details.

\`\`\`md
${directive.example.variant.md}
\`\`\`

### Variant Output

\`\`\`html
${prettify(directive.example.variant.html)}
\`\`\`


${directive.generated.variant.html ? `

### Generated Variant Output

\`\`\`html
${prettify(directive.generated.variant.html)}
\`\`\`

` : ''}

` : '' }


${ Object.keys(directive.example.attrs)[0] !== 'undefined' ? `

## Verbose Attribute Examples

${ Object.keys(directive.example.attrs).reduce((acc, curr) => {
    return acc.concat(`

#### \`${curr}\`

<details>

##### Markdown

\`\`\`md
${directive.example.attrs[curr].md}
\`\`\`

##### HTML

\`\`\`html
${prettify(directive.example.attrs[curr].html)}
\`\`\`

</details>

`) }, '')  }` : ''
 }

${directive.notes ? `\n\n## Notes\n\n${directive.notes}` : ''}

`

}



describe('md:directive', () => {
    // before((done) => {
    //     const imageBuffer = new Buffer(imageData, 'base64')
    //     const imageDir = path.join(src(), '_images')
    //     const imagePath = path.join(imageDir, 'foo.jpg')
    //     return fs.mkdirs(imageDir, (err0) => {
    //         if (err0) throw err0
    //         return fs.writeFile(imagePath, imageBuffer, (err1) => {
    //             if (err1) throw err1
    //             return done()
    //         })
    //     })
    // })

    // after(done => fs.remove(src(), (err) => {
    //     if (err) throw err
    //     done()
    // }))

    let md
    beforeEach((done) => {
        logger.reset()
        md = new MarkdownRenderer()
        done()
    })

    // // general
    // it('Should throw an error if the required attributes are not present', () => {
    //     md.load(pluginSection)
    //     const result = BLOCK_DIRECTIVES.map(d => md.parser.render(`${BLOCK_DIRECTIVE_FENCE}${d}`))
    //     return logger.errors.should.have.length(result.length)
    // })


    it(`Should print a complete list of directives
      Should add the appropriate optional and required attributes
      Should add classes to the HTML output based on directive name and type'
      Should ensure the directive\'s [id] attribute is converted to a valid HTML id
      Should interpret container types as generic container directives`, () => {
        md.load(pluginDialogue)
        md.load(pluginEpigraph)
        md.load(pluginImage)
        md.load(pluginLogo)
        md.load(pluginMedia)
        md.load(pluginPullQuote)
        md.load(pluginSection)

        const _id = () => `my-unique-id-${String(Math.random()).slice(2)}`

        let outputString = documentationHeader()
        let directiveToken = {}

        forOf(directiveSpec, (name) => {

            const directive = directiveSpec[name]


            let directiveString = ''
            let directiveOutput = ''
            let directiveOutputVariant = ''
            let supplementalOutputWithVariant = ''
            let supplementalOutputWithoutVariant = ''
            let renderedFigure = ''


            directiveToken = Object.assign(
                {},
                directive,
                {
                    name,
                    example: {
                        basic: {
                            md: '',
                            html: '',
                        },
                        variant: {
                            md: '',
                            html: '',
                        },
                        attrs: {},
                    },
                    generated: {
                        basic: {
                            html: '',
                        },
                        variant: {
                            html: '',
                        },
                        attrs: {},
                    },
                }
            )


            directive.optional.forEach((attr) => {

                const id = _id()

                directiveString = ''
                directiveString += `${BLOCK_DIRECTIVE_FENCE}${name}`

                if (directive.required.length) { // add required attrs
                    directive.required.forEach((req, i) => {
                        const reqKey = Object.keys(req)[0]
                        const reqVal = Object.values(req)[0]
                        if (reqKey === 'id') {
                            directiveString += `:${id}`
                        } else {
                            directiveString += ` ${reqKey}:${reqVal}`
                        }

                        if (i === directive.required.length - 1) {
                            directiveToken.example.basic.md = directiveString

                            if (directive.selfClosing === false && directive.syntaxVariants === false) {
                                directiveToken.example.basic.md += '\n\nHere is some *rendered* Markdown\n' // add body content to the directive since it's a container
                                directiveToken.example.basic.md += `\n::: exit:${id}` // add `exit` directive to close off the container

                                directiveToken.example.basic.html = md.parser.render(directiveToken.example.basic.md) + '</section>' // adding manually for `section` directives rn due to stor
                            } else if (directive.selfClosing && directive.syntaxVariants && directive.supplementaryOutputRepository) {

                                // create basic example
                                directiveToken.example.basic.md = directiveString
                                directiveToken.example.basic.html = md.parser.render(directiveString)
                                renderedFigure = figureTemplates(state[directive.supplementaryOutputRepository].pop(), 'epub') // add figure page html to template
                                directiveToken.generated.basic.html = renderedFigure

                                // add variant
                                directiveOutputVariant = directiveString
                                directiveOutputVariant += directive.syntaxVariants // continue to add to `directiveString`, must be done after initial render

                                // render variant
                                directiveToken.example.variant.md = directiveOutputVariant
                                directiveOutputVariant = md.parser.render(directiveOutputVariant)
                                directiveToken.example.variant.html = directiveOutputVariant
                                renderedFigure = figureTemplates(state[directive.supplementaryOutputRepository].pop(), 'epub')
                                directiveToken.generated.variant.html = renderedFigure

                            } else if (directive.selfClosing === false && directive.syntaxVariants && !directive.supplementaryOutputRepository) {
                                directiveToken.example.basic.md += '\n\nHere is some *rendered* Markdown\n'
                                directiveToken.example.basic.md += `\n::: exit:${id}`
                                directiveToken.example.basic.html = md.parser.render(directiveToken.example.basic.md) + '</section>'

                                state.reset() // reset id

                                // add variant
                                directiveOutputVariant = directiveString
                                directiveOutputVariant += directive.syntaxVariants
                                directiveOutputVariant += `\n::: exit:${id}`

                                directiveToken.example.variant.md = directiveOutputVariant

                                directiveOutputVariant = md.parser.render(directiveOutputVariant)
                                directiveToken.example.variant.html = directiveOutputVariant + '</section>'


                            } else {
                                directiveToken.example.basic.html = md.parser.render(directiveToken.example.basic.md)
                            }

                            // clear the state to prepare for attr testing
                            state.reset()
                        }

                    })
                }

                directiveString += ` ${attr.name}:${attr.value}` // add the attribute that we're testing to the directive
                directiveString += '\n' // advance to next line of directive

                directiveToken.example.attrs[attr.name] = {}
                directiveToken.generated.attrs[attr.name] = {}

                if (directive.selfClosing && directive.syntaxVariants === false) { // we don't need to explicitly exit, and there's no additional markdown that we need to add

                    directiveToken.example.attrs[attr.name].md = directiveString
                    directiveOutput = md.parser.render(directiveString) // render
                    directiveToken.example.attrs[attr.name].html = directiveOutput

                    directiveOutput.should.match(new RegExp(attr.output)) // test
                }


                if (directive.selfClosing && directive.syntaxVariants && directive.supplementaryOutputRepository) {

                    directiveToken.example.attrs[attr.name].md = directiveString
                    directiveOutput = md.parser.render(directiveString) // render
                    directiveToken.example.attrs[attr.name].html = directiveOutput

                    renderedFigure = figureTemplates(state[directive.supplementaryOutputRepository].pop(), 'epub')
                    supplementalOutputWithoutVariant = renderedFigure
                    directiveToken.generated.attrs[attr.name].html = renderedFigure

                }

                if (directive.selfClosing && directive.syntaxVariants && directive.supplementaryOutputRepository === false) {
                    directiveOutput = md.parser.render(directiveString) // render
                    directiveToken.example.attrs[attr.name].html = directiveOutput
                    directiveToken.example.attrs[attr.name].md = directiveString

                    // directiveOutput.should.match(new RegExp(attr.output)) // test

                }


                if (directive.selfClosing === false && directive.syntaxVariants === false) {
                    directiveString += '\n\nHere is some *rendered* Markdown\n' // add body content to the directive since it's a container
                    directiveString += `\n::: exit:${id}` // add `exit` directive to close off the container

                    directiveToken.example.attrs[attr.name].md = directiveString
                    directiveOutput = md.parser.render(directiveString) // render
                    directiveOutput += '</section>' // TODO: `state` gets confused re-rendering like this, so inserting closing tag manually rn
                    directiveToken.example.attrs[attr.name].html = directiveOutput

                    directiveOutput.should.match(new RegExp(attr.output)) // test
                }


                if (directive.selfClosing === false && directive.syntaxVariants && directive.supplementaryOutputRepository) {
                    directiveString += `\n${directive.syntaxVariants}\n`
                    directiveString +=  `\n::: exit:${directive.required.id}`

                    directiveToken.example.attrs[attr.name].md = directiveString
                    directiveOutput = md.parser.render(directiveString) // render
                    directiveToken.example.attrs[attr.name].html = directiveOutput


                    directiveOutput.should.match(new RegExp(attr.output)) // test

                }

                if (directive.selfClosing === false && directive.syntaxVariants && !directive.supplementaryOutputRepository) {
                    directiveString += `\n${directive.syntaxVariants}\n`
                    directiveString +=  `\n::: exit:${id}`

                    directiveToken.example.attrs[attr.name].md = directiveString
                    directiveOutput = md.parser.render(directiveString) // render
                    directiveToken.example.attrs[attr.name].html = directiveOutput + '</section>'

                    directiveOutput.should.match(new RegExp(attr.output)) // test
                }


            }) // end `directive.optional`

            outputString += wrapWithDocumentationFormatting(directiveToken)


        }) // end `forOf`

        // render complete list of directives
        //
        fs.writeFile('all-directives.md', outputString, function(err) {
            if (err) throw err
            // console.log('\t✔ Wrote all-directives')
        })

    })



    describe(':container', () => {
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

        // it('Should render a dialogue directive', () => {
        //     state.reset()
        //     md.load(pluginDialogue)
        //     const di = DIRECTIVE_ATTRIBUTES.misc.dialogue
        //     const requiredAttrs = di.required

        //     let required = ''
        //     forOf(requiredAttrs, (rk, rv) => {
        //         required += ` ${rv.input}`
        //     })
        //     // for (const [rk, rv] of entries(requiredAttrs)) {
        //     //   required += ` ${rv.input}`
        //     // }

        //     const optional = di.optional
        //     forOf(optional, (k, v) => {
        //         const input = `::: dialogue:foo ${required} ${v.input}\nfoo\n::: exit:foo`
        //         const output = md.parser.render(input)
        //     })
        //     // for (const [k, v] of entries(optional)) {
        //     //   const input = `::: dialogue:foo ${required} ${v.input}\nfoo\n::: exit:foo`
        //     //   const output = md.parser.render(input)
        //     // }
        // })
    })

    describe(':image', () => {
        beforeEach(() => {
            md.load(pluginImage)
            state.reset()
        })

        it('Logs an error if an image does not exist')//, () => {
        //     const html = md.parser.render(`${INLINE_DIRECTIVE_FENCE}image:bar source:bar.jpg`)
        //     html.should.match(/Image not found/)
        //     logger.errors.should.have.length(1)
        // })

        it('Renders without an exit directive')//, () => {
        //     const html = md.parser.render(`${INLINE_DIRECTIVE_FENCE}image:foo source:foo.jpg`)
        //     html.should.match(/<!-- START: image:image#_foo;/)
        // })

        it('Renders an image without the caption text')//, () => {
        //     let str = ''
        //     str += `${INLINE_DIRECTIVE_FENCE}image:foo source:foo.jpg`
        //     str += '\n:: bar'
        //     str += '\n::: exit:foo'
        //     const html = md.parser.render(str).split('\n')
        //     html.should.have.length(9)
        //     html[1].should.match(/<!-- START: image:image#_foo; _markdown\/undefined.md:0 -->/)
        //     html[5].should.match(/^\s+<img src="..\/images\/foo.jpg" alt="foo.jpg"\/>/)
        //     html[8].should.match(/^\s+<\/div>/)
        // })

        it('Saves captions in the global state')//, () => {
        //     let str = ''
        //     const caption = 'bar'
        //     str += `${INLINE_DIRECTIVE_FENCE}image:foo source:foo.jpg`
        //     str += `\n::${caption}`
        //     str += '\n::: exit:foo'
        //     md.parser.render(str)
        //     state.images[0].caption.should.equal(`${caption}\n`)
        // })
    })

    // describe(':attribute', () => {
    //     it('Should fallback to default attributes if invalid attributes are provided', () => {
    //         attributes(' bogus:true', 'chapter').should.equal(' epub:type="bodymatter chapter" class="bodymatter chapter"')
    //     })
    //     it('Should fallback to default attributes if none are provided', () => {
    //         attributes('', 'chapter').should.equal(' epub:type="bodymatter chapter" class="bodymatter chapter"')
    //     })
    //     it('Should log a warning to the console if an unsupported attribute is used')//, () => {
    //     //     attributes(' classes:"foo" bogus:true', 'chapter')
    //     //     logger.warnings.should.have.length(1)
    //     //     logger.warnings[0].should.match(/Removing illegal/)
    //     // })
    // })
})
