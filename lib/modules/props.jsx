
/* eslint-disable operator-linebreak */

import fs from 'fs-extra'
import mime from 'mime-types'
import terms from '../dc/terms'
import elements from '../dc/elements'

/**
 * Detects XML media-type properties based on the content of XHTML documents
 * @static
 * @class Props
 */
class Props {
  /**
   * [isHTML description]
   * @param  {String}  file File path
   * @return {Boolean}
   */
  isHTML(file) {
    return Boolean(mime.lookup(file.rootpath) === 'text/html'
      || mime.lookup(file.rootpath) === 'application/xhtml+xml')
  }

  /**
   * [isNav description]
   * @param  {String}  file File path
   * @return {Boolean}
   */
  isNav(file) {
    return Boolean(mime.lookup(file.rootpath) === 'application/xhtml+xml'
      && file.name === 'toc.xhtml')
  }

  /**
   * [isScripted description]
   * @param  {String}  file File path
   * @return {Boolean}
   */
  isScripted(file) {
    if (!this.isHTML(file)) { return false }
    const fpath = file.rootpath
    const contents = fs.readFileSync(fpath, 'utf8')
    return Boolean(contents.match(/<script/))
  }

  /**
   * [isSVG description]
   * @param  {String}  file File path
   * @return {Boolean}
   */
  isSVG(file) {
    if (!this.isHTML(file)) { return false }
    const fpath = file.rootpath
    const contents = fs.readFileSync(fpath, 'utf8')
    return Boolean(contents.match(/<svg/))
  }

  /**
   * [isDCElement description]
   * @param  {Object}  data [description]
   * @return {Boolean}
   */
  isDCElement(data) {
    return Boolean({}.hasOwnProperty.call(data, 'term')
      && elements.indexOf(data.term) > -1)
  }

  /**
   * [isDCTerm description]
   * @param  {Object<String>}  data [description]
   * @return {Boolean}
   */
  isDCTerm(data) {
    return Boolean({}.hasOwnProperty.call(data, 'term')
      && terms.indexOf(data.term) > -1)
  }

  /**
   * [testHTML description]
   * @param  {String} file File path
   * @return {Array}      An array of dublin core media-type properties
   */
  testHTML(file) {
    const props = []
    if (this.isNav(file)) { props.push('nav') }
    if (this.isScripted(file)) { props.push('scripted') }
    if (this.isSVG(file)) { props.push('svg') }
    return props
  }

  /**
   * [testMeta description]
   * @param  {Object} data [description]
   * @return {Object<Boolean>}      [description]
   */
  testMeta(data) {
    return {
      term: this.isDCTerm(data),
      element: this.isDCElement(data)
    }
  }
}

export default new Props()
