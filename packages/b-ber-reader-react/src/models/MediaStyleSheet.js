import { rand } from '../helpers/utils'

class MediaStyleSheet {
  constructor({ id, media, styles }) {
    this.id = id || `_${rand()}`
    this.media = media
    this.styles = styles
    this.node = null
  }

  writeCss(doc) {
    const css = doc.createTextNode(this.styles)

    this.node.appendChild(css)
  }

  appendSheet(doc) {
    this.node = doc.createElement('style')

    this.node.setAttribute('id', this.id)
    this.node.setAttribute('media', this.media)
    this.node.appendChild(doc.createTextNode('')) // WebKit

    this.writeCss(doc)

    doc.body.appendChild(this.node)
  }

  removeSheet(doc) {
    doc.body.removeChild(this.node)
  }
}

export default MediaStyleSheet
