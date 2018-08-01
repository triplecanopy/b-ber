import {rand} from '../helpers/utils'
import {Url} from '../helpers'

class Script {
    constructor({node, requestURI}) {
        this.id = node.id || `_${rand()}`
        this.type = node.type || 'text/javascript'
        this.src = Script.getScriptSourceFromNodeValue(node)
        this.body = node.childNodes && node.childNodes.length ? node.childNodes[0].nodeValue.trim() : ''
        this.async = true
        this.requestURI = requestURI
    }

    static getScriptSourceFromNodeValue(node) {
        const attr = node.attributes.getNamedItem('src')
        const {value} = (attr || {})
        return value
    }

    appendScript(doc) {
        const base = Url.trimFilenameFromResponse(this.requestURI)
        const src = Url.resolveRelativeURL(base, this.src)

        this.elem = doc.createElement('script')
        this.elem.id = this.id
        this.elem.src = src
        this.elem.async = this.async

        doc.body.appendChild(this.elem)

    }

    removeScript(doc) {
        doc.body.removeChild(this.elem)
    }

}

export default Script
