
import htmlparser from 'htmlparser2'

class Sanitizer {
  constructor() {
    this.output = ''
    this.whitelistedAttrs = ['src', 'href']
    this.blacklistedTags = ['html', 'head', 'title', 'meta', 'link', 'script']
    this.elementClasses = ['pull-quote']
    this.tagnames = []
    this.entries = function* (obj) {
      for (const key of Object.keys(obj)) {
        yield [key, obj[key]]
      }
    }
    this.parse = (html) => {
      const _this = this
      return new Promise((resolve, reject) => {
        const parser = new htmlparser.Parser({
          onopentag(name, attrs) {
            switch (name) {
              case 'html':
              case 'head':
              case 'title':
              case 'meta':
              case 'link':
              case 'script':
                break
              case 'body':
                _this.tagnames.push(attrs && attrs.class ? attrs.class.replace(/\s+/g, '-') : '')
                break
              case 'div':
                let tagname = name
                if (attrs && attrs.class) {
                  const klasses = attrs.class.split(' ')
                  for (let i = 0; i < klasses.length; i++) { // eslint-disable-line no-plusplus
                    if (_this.elementClasses.indexOf(klasses[i]) > -1) {
                      tagname = klasses[i]
                      break
                    }
                  }
                }
                _this.tagnames.push(tagname)
                break
              default:
                _this.tagnames.push(name)
                break
            }

            const tag = []
            for (const [key, val] of _this.entries(attrs)) {
              if (_this.whitelistedAttrs.indexOf(key) > -1) {
                tag.push(`${key}="${val}"`)
              }
            }
            tag.unshift(_this.tagnames[_this.tagnames.length - 1])
            if (name && _this.blacklistedTags.indexOf(name) < 0) {
              _this.output += `<${tag.join(' ')}>`
            }
          },
          ontext(text) {
            const tagname = _this.tagnames[_this.tagnames.length - 1]
            if (tagname && _this.blacklistedTags.indexOf(tagname) < 0) {
              _this.output += text
            }
          },
          onclosetag(name) {
            const tagname = _this.tagnames.pop()
            if (tagname) { _this.output += `</${tagname}>` }
          },
          onend() { resolve(_this.output) }
        }, { decodeEntities: true })

        parser.write(html)
        parser.end()
      })
    }
  }
}

const sanitizer = new Sanitizer()
export default sanitizer
