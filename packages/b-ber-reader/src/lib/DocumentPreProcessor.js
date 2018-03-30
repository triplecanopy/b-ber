import {mediaSmall, mediaLarge} from './multi-column-styles'
import {MediaStyleSheet} from '../models'
import {mobileViewportMaxWidth} from '../config'

class DocumentPreProcessor {
    constructor({doc}) {
        this.doc = doc
        this.breakPoint = mobileViewportMaxWidth
        this.styleSheets = [
            new MediaStyleSheet({query: `only screen and (max-width: ${this.breakPoint}px)`, rules: [...mediaSmall]}),
            new MediaStyleSheet({query: `only screen and (min-width: ${this.breakPoint + 1}px)`, rules: [...mediaLarge]}),
        ]
    }

    appendStylesheets() {
        this.styleSheets.forEach(a => a.appendSheet(this.doc))
    }

    removeScriptElements() {
        // TODO: adjust the following to allow json+ld
        const scripts = this.doc.querySelectorAll('script')
        for (let i = 0; i < scripts.length; i++) {
            scripts[i].parentNode.removeChild(scripts[i])
        }
    }

    parseXML(callback) {
        const err = null // TODO

        this.removeScriptElements()
        this.appendStylesheets()

        if (callback && typeof callback === 'function') return callback(err, this.doc)
        return this.doc
    }
}


export default DocumentPreProcessor
