import { rand } from '../helpers/utils'

export interface MediaStyleSheetOptions {
  id?: string
  media: string
  styles: string
}

class MediaStyleSheet {
  id: string
  media: string
  styles: string
  node: HTMLStyleElement | null

  constructor({ id, media, styles }: MediaStyleSheetOptions) {
    this.id = id || `_${rand()}`
    this.media = media
    this.styles = styles
    this.node = null
  }

  writeCss(doc: Document): void {
    const css = doc.createTextNode(this.styles)

    // `node` is always set by appendSheet before this runs (its only caller).
    this.node!.appendChild(css)
  }

  appendSheet(doc: Document): void {
    this.node = doc.createElement('style')

    this.node.setAttribute('id', this.id)
    this.node.setAttribute('media', this.media)
    this.node.appendChild(doc.createTextNode('')) // WebKit

    this.writeCss(doc)

    doc.body.appendChild(this.node)
  }

  removeSheet(doc: Document): void {
    // `node` is set by appendSheet before any removal; mirror the original
    // throw-on-null behavior rather than silently no-op.
    doc.body.removeChild(this.node!)
  }
}

export default MediaStyleSheet
