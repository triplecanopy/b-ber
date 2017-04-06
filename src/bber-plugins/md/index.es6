
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
import mdLogo from 'bber-plugins/md/directives/logo'
import mdImage from 'bber-plugins/md/directives/image'
import mdDialogue from 'bber-plugins/md/directives/dialogue'
import mdEpigraph from 'bber-plugins/md/directives/epigraph'

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
      linkify: false
    })

    /**
     * [nestedStrings description]
     * @member
     * @memberOf module:md#MarkIt
     * @type {Array}
     */
    this.nestedStrings = []

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
      // .use(
      //   mdSection.plugin,
      //   mdSection.name,
      //   mdSection.renderer(reference))
      .use(
        mdFootnote)
      // .use(
      //   mdImage.plugin,
      //   mdImage.name,
      //   mdImage.renderer(reference))
      .use(
        mdDialogue.plugin,
        mdDialogue.name,
        mdDialogue.renderer(reference))
      // .use(
      //   mdEpigraph.plugin,
      //   mdEpigraph.name,
      //   mdEpigraph.renderer(reference))
      // .use(
      //   mdLogo.plugin,
      //   mdLogo.name,
      //   mdLogo.renderer(reference))
      // .use(
      //   mdPullQuote.plugin,
      //   mdPullQuote.name,
      //   mdPullQuote.renderer(reference))
      .use(
        mdFrontMatter,
        (meta) => {
          const filename = this.filename
          store.add('pages', { filename, ...YAML.parse(meta) })
        })
  }

  /**
   * Callback that is called once rendering has completed
   * @param  {String} data [description]
   * @return {String}
   */
  postRenderCallback(data) {
    let result = data
    this.nestedStrings.forEach((_) => {
      result = data.replace(_.find, _.repl)
    })
    return result
  }

  set filename(name) {
    this._filename = name
  }

  get filename() {
    return this._filename
  }

  set nestedStrings(strings) {
    this._nestedStrings = strings
  }

  get nestedStrings() {
    return this._nestedStrings
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
    this.nestedStrings = []
    return this.postRenderCallback(this.md.render(data))
  }

}

// export default new MarkIt()
const markit = process.env.NODE_ENV === 'test' ? MarkIt : new MarkIt()
export default markit
