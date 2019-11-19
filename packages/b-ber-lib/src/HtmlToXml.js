import htmlparser from 'htmlparser2'
import isArray from 'lodash/isArray'

class HtmlToXml {
  constructor(customElements) {
    const defaultElements = [
      'pullquote',
      'blockquote',
      'epigraph',
      'dialogue',
      'gallery',
      'spread',
      'colophon',
      'appendix',
      'subtitle',
      'frontmatter',
      'backmatter',
      'meta-content',
      'bibliography',
      'masthead',
      'figcaption',
      'subchapter',
    ]

    this.customElements =
      customElements && isArray(customElements)
        ? [...customElements, ...defaultElements]
        : defaultElements
    this.whitelistedAttrs = [
      'src',
      'href',
      'xlink:href',
      'xmlns',
      'xmlns:xlink',
    ]
    this.blacklistedTags = [
      'html',
      'head',
      'title',
      'meta',
      'link',
      'script',
      'body',
    ]
    this.output = ''
    this.tagnames = []
    this.noop = false
  }

  appendXMLDeclaration() {
    this.output += '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
    return this
  }

  prependBody() {
    this.output += '<body>'
    return this
  }

  appendBody() {
    this.output += '</body>'
    return this
  }

  appendComment(fname) {
    this.output += `\n<!-- \n${fname}\n -->\n\n`
    return this
  }

  parse(content) {
    const _this = this // eslint-disable-line consistent-this
    _this.appendXMLDeclaration()
    // _this.appendComment(arr[index])
    _this.prependBody()

    const parser = new htmlparser.Parser(
      {
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
                for (let i = 0; i < klasses.length; i++) {
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

          if (_this.noop) return
          const tag = []
          const tagname = _this.tagnames[_this.tagnames.length - 1]
          if (tagname && _this.blacklistedTags.indexOf(tagname) < 0) {
            Object.entries(attrs).forEach(([key, val]) => {
              if (_this.whitelistedAttrs.includes(key)) {
                tag.push(`${key}="${val}"`)
              }
            })

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
        onclosetag() {
          const tagname = _this.tagnames.pop()
          if (tagname) _this.output += `</${tagname}>`
        },
        onend() {
          _this.appendBody()
          _this.onend(_this.output)
        },
      },
      { decodeEntities: false }
    )

    parser.write(content)
    parser.end()
  }
}

export default HtmlToXml
