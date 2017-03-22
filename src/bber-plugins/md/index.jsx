
/**
 * Returns an instance of the MarkIt class
 * @module md
 * @see {@link module:md#MarkIt}
 * @return {MarkIt}
 */

import YAML from 'yamljs'
import MarkdownIt from 'markdown-it'
import mdFrontMatter from 'markdown-it-front-matter'
import mdFootnote from 'bber-plugins/md/plugins/footnote'
import mdSection from 'bber-plugins/md/directives/section'
import mdPullQuote from 'bber-plugins/md/directives/pull-quote'
import mdLogo from 'bber-plugins/md/directives/logo'
import mdExit from 'bber-plugins/md/directives/exit'
import mdImages from 'bber-plugins/md/directives/images'
import mdDialogue from 'bber-plugins/md/directives/dialogue'
import mdEpigraph from 'bber-plugins/md/directives/epigraph'
import { updateStore } from 'bber-utils' // TODO: this should be called with methods in `state`

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

    this.md
      .use(
        mdSection.plugin,
        mdSection.name,
        mdSection.renderer(this.md, this))
      .use(
        mdExit.plugin,
        mdExit.name,
        mdExit.renderer(this.md, this))
      .use(
        mdFootnote)
      .use(
        mdImages.plugin,
        mdImages.name,
        mdImages.renderer(this.md, this))
      .use(
        mdDialogue.plugin,
        mdDialogue.name,
        mdDialogue.renderer(this.md, this))
      .use(
        mdEpigraph.plugin,
        mdEpigraph.name,
        mdEpigraph.renderer(this.md, this))
      .use(
        mdLogo.plugin,
        mdLogo.name,
        mdLogo.renderer(this.md, this))
      .use(
        mdPullQuote.plugin,
        mdPullQuote.name,
        mdPullQuote.renderer(this.md, this))
      .use(
        mdFrontMatter,
        (meta) => {
          const filename = this._get('filename')
          updateStore('pages', { filename, ...YAML.parse(meta) })
        })
  }

  /**
   * Callback that is called once rendering has completed
   * @param  {String} data
   * @return {String}
   */
  postRenderCallback(data) {
    let result = data
    this.nestedStrings.forEach((_) => {
      result = data.replace(_.find, _.repl)
    })
    return result
  }

  /**
   * [_set description]
   * @private
   * @param {String} key [description]
   * @param {String} val [description]
   */
  _set(key, val) {
    this[key] = val
    return this[key]
  }

  /**
   * [_get description]
   * @private
   * @param  {String} key [description]
   * @return {String}     [description]
   */
  _get(key) {
    return this[key]
  }

  /**
   * [noop description]
   * @return {} [description]
   */
  static noop() {}

  /**
   * [template description]
   * @param  {Array} meta [description]
   * @return {String}      [description]
   */
  template(meta) {
    const str = meta.split('\n').map(_ => `  ${_}`).join('\n')
    return `-\n  filename: ${this._get('filename')}\n${str}\n`
  }

  /**
   * Transforms a markdown file to XHTML
   * @param  {String} filename
   * @param  {Object} data
   * @return {MarkIt.postRenderCallback(String)}
   */
  render(filename, data) {
    this._set('filename', filename)
    this._set('nestedStrings', [])
    return this.postRenderCallback(this.md.render(data))
  }

}

// export default new MarkIt()
const markit = process.env.NODE_ENV === 'test' ? MarkIt : new MarkIt()
export default markit
