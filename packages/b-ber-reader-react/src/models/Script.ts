import isUndefined from 'lodash/isUndefined'
import Url from '../helpers/Url'
import { rand } from '../helpers/utils'

export interface ScriptOptions {
  node: HTMLScriptElement
  requestURI: string
}

class Script {
  id: string
  type: string
  src: string | undefined
  inline: boolean
  body: string
  async: boolean
  requestURI: string
  elem!: HTMLScriptElement

  constructor({ node, requestURI }: ScriptOptions) {
    this.id = node.id || `_${rand()}`
    this.type = node.type || 'application/javascript'
    this.src = Script.getScriptSourceFromNodeValue(node)
    this.inline = isUndefined(this.src)
    this.body =
      node.childNodes && node.childNodes.length
        ? (node.childNodes[0].nodeValue ?? '').trim()
        : ''
    this.async = false
    this.requestURI = requestURI
  }

  static getScriptSourceFromNodeValue(
    node: HTMLScriptElement
  ): string | undefined {
    const attr = node.attributes.getNamedItem('src')
    const { value } = attr || {}
    return value
  }

  appendScript(doc: Document): void {
    const base = Url.trimFilenameFromResponse(this.requestURI)
    const src = !this.inline ? Url.resolveRelativeURL(base, this.src) : null

    this.elem = doc.createElement('script')
    this.elem.id = this.id

    if (!this.inline && src) this.elem.src = src
    if (this.inline) this.elem.innerHTML = this.body
    if (this.async) this.elem.async = true

    doc.body.appendChild(this.elem)
  }

  removeScript(doc: Document): void {
    doc.body.removeChild(this.elem)
  }
}

export default Script
