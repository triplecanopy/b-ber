
import YAML from 'yamljs'
import MarkdownIt from 'markdown-it'
import mdFrontMatter from 'markdown-it-front-matter'
import mdFootnote from '../md/plugins/footnote'
import mdSection from '../md/directives/section'
import mdPullQuote from '../md/directives/pull-quote'
import mdLogo from '../md/directives/logo'
import mdExit from '../md/directives/exit'
import mdImages from '../md/directives/images'
import mdDialogue from '../md/directives/dialogue'
import mdEpigraph from '../md/directives/epigraph'
import { updateStore } from '../utils' // TODO: this should be called with methods in `state`

class MarkIt {
  constructor() {
    const md = new MarkdownIt({
      html: true,
      xhtmlOut: true,
      breaks: false,
      linkify: false
    })

    md
    .use(
      mdSection.plugin,
      mdSection.name,
      mdSection.renderer(md, this))
    .use(
      mdExit.plugin,
      mdExit.name,
      mdExit.renderer(md, this))
    .use(
      mdFootnote)
    .use(
      mdImages.plugin,
      mdImages.name,
      mdImages.renderer(md, this))
    .use(
      mdDialogue.plugin,
      mdDialogue.name,
      mdDialogue.renderer(md, this))
    .use(
      mdEpigraph.plugin,
      mdEpigraph.name,
      mdEpigraph.renderer(md, this))
    .use(
      mdLogo.plugin,
      mdLogo.name,
      mdLogo.renderer(md, this))
    .use(
      mdPullQuote.plugin,
      mdPullQuote.name,
      mdPullQuote.renderer(md, this))
    .use(
      mdFrontMatter,
      (meta) => {
        const filename = this._get('filename')
        updateStore('pages', { filename, ...YAML.parse(meta) })
      })

    this.nestedStrings = []

    this.postRenderCallback = function postRenderCallback(data) {
      let result = data
      this.nestedStrings.forEach((_) => {
        result = data.replace(_.find, _.repl)
      })
      return result
    }

    this._set = function _set(key, val) {
      this[key] = val
      return this[key]
    }

    this._get = function _get(key) {
      return this[key]
    }

    this.filename = null
    this.noop = function noop() {}

    this.template = function template(meta) {
      const str = meta.split('\n').map(_ => `  ${_}`).join('\n')
      return `-\n  filename: ${this._get('filename')}\n${str}\n`
    }

    this.render = function render(filename, data) {
      this._set('filename', filename)
      this._set('nestedStrings', [])
      return this.postRenderCallback(md.render(data))
    }
  }
}

export default new MarkIt()
