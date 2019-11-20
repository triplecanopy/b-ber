import { Parser } from 'htmlparser2'

class HtmlToXmlParser {
  constructor({ content, onEndCallback }) {
    this.customElementNames = {
      pullquote: true,
      blockquote: true,
      epigraph: true,
      dialogue: true,
      gallery: true,
      spread: true,
      colophon: true,
      appendix: true,
      subtitle: true,
      frontmatter: true,
      backmatter: true,
      'meta-content': true,
      bibliography: true,
      masthead: true,
      figcaption: true,
      subchapter: true,
    }

    this.whitelistedAttributes = {
      src: true,
      href: true,
      'xlink:href': true,
      xmlns: true,
      'xmlns:xlink': true,
    }

    this.blacklistedTagNames = {
      html: true,
      head: true,
      title: true,
      meta: true,
      link: true,
      script: true,
      body: true,
    }

    this.containingTagNames = {
      div: true,
      span: true,
      section: true,
    }

    this.content = content
    this.onEndCallback = onEndCallback

    this.output = ''
    this.tagList = []

    this.onopentag = this.onopentag.bind(this)
    this.ontext = this.ontext.bind(this)
    this.onclosetag = this.onclosetag.bind(this)
    this.onend = this.onend.bind(this)
  }

  writeXMLDeclaration() {
    this.output += '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
  }

  // eslint-disable-next-line class-methods-use-this
  renameAttribute(name, attribute) {
    const elementAttributeNames = {
      img: { src: 'href' },
    }
    if (!elementAttributeNames[name]) return attribute
    return elementAttributeNames[name][attribute] || attribute
  }

  writeTagOpen(name, attributes = {}) {
    let tag = [name]

    tag = Object.entries(attributes).reduce(
      (acc, [key, val]) =>
        this.whitelistedAttributes[key]
          ? acc.concat(`${this.renameAttribute(name, key)}="${val}"`)
          : acc,
      tag
    )

    tag = tag.join(' ')
    this.output += `<${tag}>`
  }

  writeTagClose(name) {
    this.output += `</${name}>`
    this.output += '\n'
  }

  addTag(name) {
    this.tagList.push(name)
  }

  removeTag() {
    return this.tagList.pop()
  }

  getTag() {
    if (!this.tagList.length) return null
    return this.tagList[this.tagList.length - 1]
  }

  onopentag(name, attributes) {
    if (this.blacklistedTagNames[name]) return

    if (name === 'body') {
      if (attributes && attributes.class) {
        // eslint-disable-next-line no-param-reassign
        name = attributes.class.replace(/\s+/g, '-')
      }
    } else if (this.containingTagNames[name]) {
      if (attributes && attributes.class) {
        const classNames = attributes.class.split(' ')

        for (let i = 0; i < classNames.length; i++) {
          if (this.customElementNames[classNames[i]]) {
            // eslint-disable-next-line no-param-reassign
            name = classNames[i]
          }
        }
      }
    }

    this.addTag(name)
    this.writeTagOpen(name, attributes)
  }

  ontext(text) {
    if (!text.trim()) return

    const name = this.getTag()
    if (!name || this.blacklistedTagNames[name]) return

    this.output += text
  }

  onclosetag() {
    const name = this.removeTag()
    if (name) this.writeTagClose(name)
  }

  onend() {
    this.writeTagClose('body')
    this.onEndCallback(this.output)
  }

  parse() {
    this.writeXMLDeclaration()
    this.writeTagOpen('body')

    const parser = new Parser(
      {
        onclosetag: this.onclosetag,
        onopentag: this.onopentag,
        ontext: this.ontext,
        onend: this.onend,
      },
      { decodeEntities: false }
    )

    parser.write(this.content)
    parser.end()
  }
}

export default HtmlToXmlParser
