
import fs from 'fs-extra'
import path from 'path'
import MarkdownIt from 'markdown-it'

// https://www.npmjs.com/package/markdown-it-footnote
import mdFootnote from 'markdown-it-footnote'
// https://www.npmjs.com/package/markdown-it-front-matter
import mdFrontMatter from 'markdown-it-front-matter'

import mdSection from './md-directives/md-section'
import mdImages from './md-directives/md-images'

import conf from './config'

class MarkIt {
  constructor() {

    const md = new MarkdownIt({
      html: true,
      xhtmlOut: true,
      breaks: false,
      linkify: false
    })

    md.use(
      mdSection.plugin,
      mdSection.name,
      mdSection.renderer(md)
    ).use(
      mdFootnote
    ).use(
      mdImages.plugin,
      mdImages.name,
      mdImages.renderer(md)
    ).use(
      mdFrontMatter,
      meta => fs.appendFile(
        this._get('metapath'),
        this.template(meta),
        this.noop()
      )
    )

    this._set = function _set(key, val) {
      this[key] = val
      return this[key]
    }

    this._get = function _get(key) {
      return this[key]
    }

    this.filename = null
    this.metapath = null

    this.noop = function noop() {}

    this.template = function template(meta) {
      const str = meta.split('\n').map(_ => `  ${_}`).join('\n')
      return `-\n  filename: ${this._get('filename')}\n${str}\n`
    }

    this.render = function render(filename, data) {
      this._set('filename', filename)
      return md.render(data)
    }

    this.setup = function setup() {
      return new Promise((resolve, reject) => {
        this._set('metapath', path.join(__dirname, '../', conf.src, 'pagemeta.yaml'))
        return fs.remove(this._get('metapath'), (err1) => {
          if (err1) { reject(new Error(err1)) }
          fs.writeFile(this._get('metapath'), '---\n', (err2) => {
            if (err2) { reject(new Error(err2)) }
            resolve()
          })
        })
      })
    }

  }
}

export default new MarkIt()
