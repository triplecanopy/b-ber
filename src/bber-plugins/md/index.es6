
/**
 * Returns an instance of the MarkIt class
 * @module md
 * @see {@link module:md#MarkIt}
 * @return {MarkIt}
 */

import YAML from 'yamljs'
import MarkdownIt from 'markdown-it'
import mdFrontMatter from 'markdown-it-front-matter'
import store from 'bber-lib/store'
import mdFootnote from 'bber-plugins/md/plugins/footnote'
import mdSection from 'bber-plugins/md/directives/section'
import mdPullQuote from 'bber-plugins/md/directives/pull-quote'
// import mdLogo from 'bber-plugins/md/directives/logo'
import mdImage from 'bber-plugins/md/directives/image'
import mdDialogue from 'bber-plugins/md/directives/dialogue'
import mdEpigraph from 'bber-plugins/md/directives/epigraph'

import { find } from 'lodash'

/**
 * Transform markdown into XHTML
 * @alias module:md#MarkIt
 */
class MarkIt {

  /**
   * @constructor
   */
  constructor() {
    this.noop = MarkIt.noop

    /**
     * Instance of MarkdownIt class
     * @member
     * @memberOf module:md#MarkIt
     * @see {@link https://github.com/markdown-it/markdown-it|markdown-it}
     * @type {MarkdownIt}
     */
    this.md = new MarkdownIt({
      html: true,
      xhtmlOut: true,
      breaks: false,
      linkify: false,
    })

    /**
     * [filename description]
     * @member
     * @memberOf module:md#MarkIt
     * @type {String}
     */
    this.filename = ''

    const context = this
    const instance = this.md
    const reference = { instance, context }

    instance
      .use(
        mdSection.plugin,
        mdSection.name,
        mdSection.renderer(reference))
      .use(
        mdPullQuote.plugin,
        mdPullQuote.name,
        mdPullQuote.renderer(reference))
      .use(
        mdFrontMatter,
        (meta) => {
          const filename = this.filename
          store.add('pages', { filename, ...YAML.parse(meta) })
        })
      .use(
        mdFootnote,
        (tokens) => {
          const filename = this.filename
          const page = find(store.pages, { filename })
          const title = page && page.title ? page.title : filename

          // add footnote container and heading. we're doing this here instead
          // of in `footnotes.js` because we need some file info (just the title :/)
          tokens.unshift({
            type: 'block',
            tag: 'section',
            attrs: [['class', 'footnotes break-after']],
            nesting: 1,
            block: true,
          }, {
            type: 'block',
            tag: 'h1',
            nesting: 1,
            block: true,
          }, {
            type: 'text',
            block: false,
            content: title,
          }, {
            type: 'block',
            tag: 'h1',
            nesting: -1,
          })

          // add closing section tag
          tokens.push({
            type: 'block',
            tag: 'section',
            nesting: -1,
          })

          const notes = instance.renderer.render(tokens, 0, { reference: `${filename}.xhtml` })
          store.add('footnotes', { filename, title, notes })
        })
      .use(
        mdDialogue.plugin,
        mdDialogue.name,
        mdDialogue.renderer(reference))
      .use(
        mdImage.plugin,
        mdImage.name,
        mdImage.renderer(reference))
      .use(
        mdEpigraph.plugin,
        mdEpigraph.name,
        mdEpigraph.renderer(reference))
      // .use(
      //   mdLogo.plugin,
      //   mdLogo.name,
      //   mdLogo.renderer(reference))
  }

  set filename(name) {
    this._filename = name
  }

  get filename() {
    return this._filename
  }

  /**
   * [template description]
   * @param  {Array} meta [description]
   * @return {String}
   */
  template(meta) {
    const str = meta.split('\n').map(_ => `  ${_}`).join('\n')
    return `-\n  filename: ${this.filename}\n${str}\n`
  }

  /**
   * Transforms a markdown file to XHTML
   * @param  {String} filename [description]
   * @param  {Object} data     [description]
   * @return {String}
   */
  render(filename, data) {
    this.filename = filename
    return this.md.render(data)
  }

}

// export default new MarkIt()
const markit = process.env.NODE_ENV === 'test' ? MarkIt : new MarkIt()
export default markit
