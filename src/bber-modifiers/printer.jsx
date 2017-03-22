
import htmlparser from 'htmlparser2'
import path from 'path'
import { Parser } from 'bber-modifiers'

/**
 * @class Printer
 * @extends Parser
 */
class Printer extends Parser {
  constructor(basePath) {
    super()
    this.basePath = basePath
  }

  onend(resolve/* , index, len */) {
    resolve(this.output)
  }

  /**
   * [filterTags description]
   * @param  {String} name       XHTML tag name
   * @param  {Number} idx        [description]
   * @param  {Number} len        [description]
   * @param  {Boolean} shouldOpen [description]
   * @return {Printer}
   */
  filterTags(name, idx, len, shouldOpen) {
    const firstDoc = idx === 0
    const lastDoc = idx === len

    switch (name) {
      case 'head':
      case 'link':
        if (!firstDoc) {
          this.noop = true
        } else {
          this.noop = false
        }
        break
      case 'html':
      case 'body':
        if (firstDoc && shouldOpen) {
          this.noop = false
        } else if (lastDoc && !shouldOpen) {
          this.noop = false
        } else {
          this.noop = true
        }
        break
      case 'xml':
      case 'meta':
      case 'title':
      case 'script':
        this.noop = true
        break
      default:
        this.noop = false
        break
    }
  }

  /**
   * [parse description]
   * @param  {String} content XTHML file contents
   * @param  {Number} index   [description]
   * @param  {Number} arr     [description]
   * @return {Promise<Object|Error>}
   */
  parse(content, index, arr) {
    const _this = this // eslint-disable-line consistent-this
    const len = arr.length - 1
    return new Promise((resolve/* , reject */) => {
      const printer = new htmlparser.Parser({
        onopentag(name, attrs) {
          _this.filterTags(name, index, len, true)

          if (_this.noop) { return }

          const tag = [name]
          for (const [key, val] of _this.entries(attrs)) {
            let prop = val
            if (key === 'src' || key === 'xlink:href' || (name === 'link' && key === 'href')) {
              prop = path.resolve(_this.basePath, 'OPS/text', val)
            }
            tag.push(`${key}="${prop}"`)
          }
          _this.output += `<${tag.join(' ')}>`
        },
        ontext(text) {
          _this.output += text
        },
        onclosetag(name) {
          _this.filterTags(name, index, len, false)
          if (_this.noop) { return }
          _this.output += `</${name}>`
        },
        onend() {
          _this.onend(resolve/* , index, len */)
        }
      }, { decodeEntities: false })

      printer.write(content)
      printer.end()
      _this.reset()
    })
  }

}

export default Printer
