import { rand } from '../helpers/utils'
import { Url } from '../helpers'

class Script {
  constructor({ node, requestURI }) {
    this.id = node.id || `_${rand()}`
    this.type = node.type || 'application/javascript'
    this.src = Script.getScriptSourceFromNodeValue(node)
    this.inline = typeof this.src === 'undefined'
    this.body =
      node.childNodes && node.childNodes.length
        ? node.childNodes[0].nodeValue.trim()
        : ''
    this.async = false
    this.requestURI = requestURI
  }

  static getScriptSourceFromNodeValue(node) {
    const attr = node.attributes.getNamedItem('src')
    const { value } = attr || {}
    return value
  }

  appendScript(doc) {
    const base = Url.trimFilenameFromResponse(this.requestURI)
    const src = !this.inline ? Url.resolveRelativeURL(base, this.src) : null

    this.elem = doc.createElement('script')
    this.elem.id = this.id

    if (!this.inline) this.elem.src = src
    if (this.inline) this.elem.innerHTML = this.body
    if (this.async) this.elem.async = true

    doc.body.appendChild(this.elem)
  }

  removeScript(doc) {
    doc.body.removeChild(this.elem)
  }
}

export default Script
