
import htmlparser from 'htmlparser2'

class Sanitizer {
  constructor(customElements) {
    const defaultElements = [
      'pull-quote',
      'epigraph',
      'dialogue',
      'colophon',
      'appendix',
      'subtitle',
      'frontmatter',
      'backmatter',
      'meta-content',
      'bibliography',
      'masthead',
      'figcaption',
      'subchapter'
    ]
    const elements = customElements && customElements.constructor === Array
      ? [...customElements, ...defaultElements]
      : defaultElements

    this.customElements = elements
    this.whitelistedAttrs = ['src', 'href', 'xlink:href']
    this.blacklistedTags = ['html', 'head', 'title', 'meta', 'link', 'script', 'body']
    this.output = ''
    this.tagnames = []
    this.noop = false
    this.entries = function* (obj) {
      for (const key of Object.keys(obj)) {
        yield [key, obj[key]]
      }
    }
    this.reset = () => {
      this.output = ''
      this.tagnames = []
      this.noop = false
    }
    this.onend = (resolve) => {
      this.output += '<pagebreak></pagebreak>'
      resolve(this.output)
    }
    this.parse = (html) => {
      const _this = this // eslint-disable-line consistent-this
      return new Promise((resolve, reject) => {
        const parser = new htmlparser.Parser({
          onopentag(name, attrs) {
            _this.noop = false
            switch (name) {
              case 'html':
              case 'head':
              case 'title':
              case 'meta':
              case 'link':
              case 'script':
                _this.noop = true
                break
              case 'body':
                if (attrs && attrs.class) {
                  _this.tagnames.push(attrs.class.replace(/\s+/g, '-'))
                }
                break
              case 'div':
              case 'span':
              case 'section': {
                let tagname = name
                if (attrs && attrs.class) {
                  const klasses = attrs.class.split(' ')
                  for (let i = 0; i < klasses.length; i++) { // eslint-disable-line no-plusplus
                    if (_this.customElements.indexOf(klasses[i]) > -1) {
                      tagname = klasses[i]
                      break
                    }
                  }
                }
                _this.tagnames.push(tagname)
                break
              }
              default:
                _this.tagnames.push(name)
                break
            }

            if (_this.noop) { return }
            const tag = []
            const tagname = _this.tagnames[_this.tagnames.length - 1]
            if (tagname && _this.blacklistedTags.indexOf(tagname) < 0) {
              for (const [key, val] of _this.entries(attrs)) {
                if (_this.whitelistedAttrs.indexOf(key) > -1) {
                  tag.push(`${key}="${val}"`)
                }
              }
              tag.unshift(tagname)
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
          onend() { _this.onend(resolve) }
        }, { decodeEntities: true })

        parser.write(html)
        parser.end()

        _this.reset()
      })
    }
  }
}

export default Sanitizer
