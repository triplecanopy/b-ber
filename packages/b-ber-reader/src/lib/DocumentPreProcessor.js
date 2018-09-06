import find from 'lodash/find'
import {mediaSmall, mediaLarge} from './multi-column-styles'
import {MediaStyleSheet, Script} from '../models'
import {media} from '../constants'

const state = {
    root: null,         // app context, used for styles
    document: null,     // content context, used for (removing) scripts
    styleSheets: [],    // MediaStyleSheet list
    scripts: [],        // scripts
    requestURI: '',     // original domain of the request
}

class DocumentPreProcessor {
    static setContextDocument(document) {
        state.document = document
    }

    static setRootDocument(document) {
        state.root = document
    }

    static setRequestURI(requestURI) {
        state.requestURI = requestURI
    }

    static createStyleSheets({paddingLeft, columnGap}) {
        state.styleSheets = [
            ...state.styleSheets,
            new MediaStyleSheet({
                media: media.MEDIA_QUERY_LARGE,
                rules: [...mediaSmall({paddingLeft, columnGap})],
            }),
            new MediaStyleSheet({
                media: media.MEDIA_QUERY_SMALL,
                rules: [...mediaLarge({paddingLeft, columnGap})],
            }),
        ]
    }

    static appendStyleSheets() {
        state.styleSheets.forEach(a =>
            (state.root.querySelector(`#${a.id}`) === null) && a.appendSheet(state.root)
        )
    }

    static appendScripts() {
        state.scripts.forEach(a =>
            (a.src && a.type === 'text/javascript') && a.appendScript(state.root) // TODO: better filter needed here
        )
    }

    static createScriptElements() {
        const scriptElements = Array.prototype.slice.call((state.document.querySelectorAll('script') || []), 0)
        const {requestURI, scripts} = state

        if (!scriptElements) return scripts

        state.scripts = scriptElements.map(node => (new Script({node, requestURI})))

        return state.scripts
    }

    static removeScriptElements() {
        const scripts = state.document.querySelectorAll('script')
        for (let i = 0; i < scripts.length; i++) {
            scripts[i].parentNode.removeChild(scripts[i])
        }
    }

    static getStyleSheetByMediaOrId({id, media}) {
        if (!id && !media) return console.warn('DocumentPreProcessor#updateStyleSheet requires either and \'id\' or a \'media\' parameter')

        let styleSheetId

        if (id) {
            styleSheetId = id
        }

        else if (media) {
            const _styleSheet = find(this.styleSheets, {media})
            if (!_styleSheet) return console.warn('No styleSheet exists for provided \'id\' or \'media\'', id, media)

            styleSheetId = _styleSheet.id
        }

        const styleSheetElement = state.root.querySelector(`#${styleSheetId}`)

        if (!styleSheetElement) return console.warn('No styleSheet exists for provided \'id\' or \'media\'', id, media)

        return {styleSheetElement, styleSheetId}
    }

    static removeStyleSheet({id, media}) {
        const {styleSheetElement} = DocumentPreProcessor.getStyleSheetByMediaOrId({id, media})
        styleSheetElement.parentNode.removeChild(styleSheetElement)
        state.styleSheets = [...state.styleSheets.filter(a => a.id !== id)]
    }

    static removeStyleSheets() {
        let sheet
        while ((sheet = state.styleSheets.pop())) {
            DocumentPreProcessor.removeStyleSheet({id: sheet.id})
        }
    }

    static removeScript({id}) {
        const script = state.root.querySelector(`#${id}`)
        if (script) script.parentNode.removeChild(script)
        state.scripts = [...state.scripts.filter(a => a.id !== id)]
    }

    static removeScripts() {
        let script
        while ((script = state.scripts.pop())) {
            DocumentPreProcessor.removeScript({id: script.id})
        }
    }

    // exchange an existing media stylesheet for a new one that targets the
    // same media
    static swapStyleSheet(/* media */) {
    }

    static swapStyleSheets() {
    }

    static getStyleSheets() {
        return state.styleSheets
    }

    static getContextDocument() {
        return state.document
    }

    static getRootDocument() {
        return state.root
    }

    static parseXML(callback) {
        const err = null // TODO

        DocumentPreProcessor.removeScriptElements()
        DocumentPreProcessor.appendStyleSheets()
        DocumentPreProcessor.appendScripts()

        if (callback && typeof callback === 'function') return callback(err, state.document)
        return state.document
    }
}


export default DocumentPreProcessor
