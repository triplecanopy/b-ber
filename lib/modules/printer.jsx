
import htmlparser from 'htmlparser2'
import Parser from './parser'

class Printer extends Parser {
  constructor() {
    super()
    this.onend = (resolve/* , index, len */) => {
      resolve(this.output)
    }
    this.filterTags = function(name, idx, len, shouldOpen) {

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
    this.parse = (content, index, arr) => {
      const _this = this // eslint-disable-line consistent-this
      const len = arr.length - 1
      return new Promise((resolve/* , reject */) => {
        const parser = new htmlparser.Parser({
          onopentag(name, attrs) {
            _this.filterTags(name, index, len, true)

            if (_this.noop) { return }

            const tag = [name]
            for (const [key, val] of _this.entries(attrs)) {
              tag.push(`${key}="${val}"`)
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

        parser.write(content)
        parser.end()
        _this.reset()
      })
    }
  }
}

export default Printer
