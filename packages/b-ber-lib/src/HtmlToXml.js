import path from 'path'
import { Parser } from 'htmlparser2'
import state from './State'

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

    this.inlineElementNames = {
      pagebreak: true,
      a: false,
      abbr: true,
      acronym: true,
      audio: false,
      b: true,
      bdi: true,
      bdo: true,
      big: true,
      br: false,
      button: false,
      canvas: true,
      cite: true,
      code: true,
      data: true,
      datalist: true,
      del: true,
      dfn: true,
      em: true,
      embed: false,
      i: true,
      iframe: false,
      img: false,
      input: false,
      ins: true,
      kbd: true,
      label: false,
      map: true,
      mark: true,
      meter: true,
      noscript: false,
      object: false,
      output: true,
      picture: false,
      progress: false,
      q: true,
      ruby: true,
      s: true,
      samp: true,
      script: false,
      select: false,
      slot: true,
      small: true,
      span: true,
      strong: true,
      sub: true,
      sup: true,
      svg: true,
      template: true,
      textarea: false,
      time: true,
      u: true,
      tt: true,
      var: true,
      video: false,
      wbr: true,
    }

    this.whitelistedAttributes = {
      src: true,
      href: true,
      'xlink:href': true,
      xmlns: true,
      'xmlns:xlink': true,
      class: true,
    }

    this.blacklistedTagNames = {
      html: true,
      head: true,
      title: true,
      meta: true,
      link: true,
      script: true,
      body: true,
      video: true,
      audio: true,
    }

    this.containingTagNames = {
      div: true,
      span: true,
      section: true,
    }

    this.elementAttributeNames = {
      img: { src: 'href' },
      source: { src: 'href' },
    }

    this.elementAttributeTransformers = {
      img: {
        src: value =>
          `file://${path.resolve(state.dist.images(path.basename(value)))}`,
      },
      source: {
        src: value =>
          `file://${path.resolve(state.dist.media(path.basename(value)))}`,
      },
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

  writePageBreak() {
    this.output += '<pagebreak></pagebreak>'
  }

  writeXMLDeclaration() {
    this.output += '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
  }

  renameAttribute(name, attribute) {
    if (!this.elementAttributeNames[name]) return attribute
    return this.elementAttributeNames[name][attribute] || attribute
  }

  transformAttributeValue(name, attribute, value) {
    if (
      !this.elementAttributeTransformers[name] ||
      !this.elementAttributeTransformers[name][attribute]
    ) {
      return value
    }

    return this.elementAttributeTransformers[name][attribute](value)
  }

  writeTagOpen(name, attributes = {}) {
    let tag = [name]

    tag = Object.entries(attributes).reduce(
      (acc, [key, val]) =>
        this.whitelistedAttributes[key]
          ? acc.concat(
              `${this.renameAttribute(
                name,
                key
              )}="${this.transformAttributeValue(name, key, val)}"`
            )
          : acc,
      tag
    )

    if (attributes.class) {
      const classNames = new Set(attributes.class.split(' '))
      if (
        (classNames.has('figure__large') && classNames.has('figure__inline')) ||
        classNames.has('gallery__item')
      ) {
        this.writePageBreak()
      }
    }

    tag = tag.join(' ')
    this.output += `<${tag}>`
  }

  writeTagClose(name) {
    this.output += `</${name}>`
    if (!this.inlineElementNames[name]) this.output += '\n'
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

  onopentag(name, attributes = {}) {
    if (this.blacklistedTagNames[name]) return

    if (name === 'body') {
      // Special case for body
      if (attributes.class) {
        // eslint-disable-next-line no-param-reassign
        name = attributes.class.replace(/\s+/g, '-')
      }
    } else if (name === 'source') {
      // Handle both audio and video elements' source tags. The audio and video
      // elements themselves are blacklisted, so the child sources are used as
      // the XML tags for the mp3/mp4s. Only allow mp3/mp4 file extensions since
      // those are the only formats supported by INDD.
      if (!attributes.src || !/\.mp[34]$/i.test(attributes.src)) {
        return
      }
    } else if (this.containingTagNames[name]) {
      // Generic tag
      if (attributes.class) {
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
      {
        decodeEntities: false,
      }
    )

    parser.write(this.content)
    parser.end()
  }
}

export default HtmlToXmlParser
