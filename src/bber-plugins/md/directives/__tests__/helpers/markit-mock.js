'use strict'

const MarkdownIt = require('markdown-it')

class Md {
  constructor(options = {}) {
    const defaults = {
      html: true,
      xhtmlOut: true,
      breaks: false,
      linkify: false
    }
    const settings = Object.assign({}, defaults, options)
    this.parser = new MarkdownIt(settings)
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

exports.default = Md
