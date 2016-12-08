
import path from 'path'
import fs from 'fs-extra'
import mime from 'mime-types'

import terms from './dc/terms'
import elements from './dc/elements'

class Props {
  constructor() {
    this.isHTML = function isHTML(file) {
      return Boolean(mime.lookup(file.fullpath) !== 'text/html'
        || mime.lookup(file.fullpath) !== 'application/xhtml+xml')
    }
    this.isNav = function isNav(file) {
      return Boolean(mime.lookup(file.fullpath) === 'application/xhtml+xml'
        && file.name === 'toc.xhtml')
    }
    this.isScripted = function isScripted(file) {
      if (!this.isHTML(file)) { return false }
      const fpath = path.join(__dirname, '../', file.fullpath)
      const contents = fs.readFileSync(fpath, 'utf8')
      return Boolean(contents.match(/<script/))
    }
    this.isSVG = function isSVG(file) {
      if (!this.isHTML(file)) { return false }
      const fpath = path.join(__dirname, '../', file.fullpath)
      const contents = fs.readFileSync(fpath, 'utf8')
      return Boolean(contents.match(/<svg/))
    }
    this.isDCElement = function isDCElement(data) {
      return Boolean({}.hasOwnProperty.call(data, 'term')
        && elements.indexOf(data.term) > -1)
    }
    this.isDCTerm = function isDCTerm(data) {
      return Boolean({}.hasOwnProperty.call(data, 'term')
        && terms.indexOf(data.term) > -1)
    }
  }

  testHTML(file) {
    const props = []
    if (this.isNav(file)) { props.push('nav') }
    if (this.isScripted(file)) { props.push('scripted') }
    if (this.isSVG(file)) { props.push('svg') }
    return props
  }

  testMeta(data) {
    return {
      term: this.isDCTerm(data),
      element: this.isDCElement(data)
    }
  }
}

export default new Props()
