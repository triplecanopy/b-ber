
import path from 'path'
import fs from 'fs-extra'
import mime from 'mime-types'

class Attrs {
  constructor() {
    this.isNav = function isNav(file) {
      return Boolean(mime.lookup(file.fullpath) === 'application/x-dtbncx+xml')
    }
    this.isScripted = function isScripted(file) {
      if (mime.lookup(file.fullpath) !== 'text/html'
        && mime.lookup(file.fullpath) !== 'application/xhtml+xml') {
        return false
      }

      const fpath = path.join(__dirname, '../', file.fullpath)
      const contents = fs.readFileSync(fpath, 'utf8')
      return Boolean(contents.match(/<script/))
    }
    this.isSVG = function isSVG(file) {
      if (mime.lookup(file.fullpath) !== 'text/html'
        && mime.lookup(file.fullpath) !== 'application/xhtml+xml') {
        return false
      }

      const fpath = path.join(__dirname, '../', file.fullpath)
      const contents = fs.readFileSync(fpath, 'utf8')
      return Boolean(contents.match(/<svg/))
    }
  }

  test(file) {
    const attrs = []
    if (this.isNav(file))       { attrs.push('nav') }      // eslint-disable-line no-multi-spaces
    if (this.isScripted(file))  { attrs.push('scripted') } // eslint-disable-line no-multi-spaces
    if (this.isSVG(file))       { attrs.push('svg') }      // eslint-disable-line no-multi-spaces
    return attrs.join(',')
  }
}

export default new Attrs()
