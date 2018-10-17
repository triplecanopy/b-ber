import { rand } from '../helpers/utils'

class MediaStyleSheet {
    constructor({ id, media, rules }) {
        this.id = id || `_${rand()}`
        this.media = media
        this.rules = rules
        this.elem = null
    }

    insertRules(doc) {
        this.rules.forEach(a =>
            this.elem.appendChild(
                doc.createTextNode(
                    `${a.selector} { ${a.declarations.join(';')} }`,
                ),
            ),
        )
    }

    appendSheet(doc) {
        this.elem = doc.createElement('style')

        this.elem.setAttribute('id', this.id)
        this.elem.setAttribute('media', this.media)
        this.elem.appendChild(doc.createTextNode('')) // WebKit hack

        this.insertRules(doc)
        doc.body.appendChild(this.elem)
    }

    removeSheet(doc) {
        doc.body.removeChild(this.elem)
    }
}

export default MediaStyleSheet
