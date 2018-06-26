import find from 'lodash/find'
import {mediaSmall, mediaLarge} from './multi-column-styles'
import {MediaStyleSheet} from '../models'
import {media} from '../constants'

const state = {
    root: null,         // app context, used for styles
    document: null,     // content context, used for (removing) scripts
    styleSheets: [],    // MediaStyleSheet list
}

class DocumentPreProcessor {
    static setContextDocument(document) {
        state.document = document
    }

    static setRootDocument(document) {
        state.root = document
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

    static removeScriptElements() {
        // TODO: adjust the following to allow json+ld. might want to move the
        // json from state.document to state.root
        const scripts = state.document.querySelectorAll('script')
        for (let i = 0; i < scripts.length; i++) {
            scripts[i].parentNode.removeChild(scripts[i])
        }
    }

    static getStyleSheetByMediaOrId({id, media}) {
        if (!id && !media) return console.warn(`DocumentPreProcessor#updateStyleSheet requires either and 'id' or a 'media' parameter`)

        let styleSheetId

        if (id) {
            styleSheetId = id
        }

        else if (media) {
            const _styleSheet = find(this.styleSheets, {media})
            if (!_styleSheet) return console.warn(`No styleSheet exists for provided 'id' or 'media'`, id, media)

            styleSheetId = _styleSheet.id
        }

        const styleSheetElement = state.root.querySelector(`#${styleSheetId}`)

        if (!styleSheetElement) return console.warn(`No styleSheet exists for provided 'id' or 'media'`, id, media)

        return {styleSheetElement, styleSheetId}
    }

    static removeStyleSheet({id, media}) {
        const {styleSheetElement, styleSheetId} = DocumentPreProcessor.getStyleSheetByMediaOrId({id, media})
        styleSheetElement.parentNode.removeChild(styleSheetElement)
        state.styleSheets = [...state.styleSheets.filter(a => a.id !== styleSheetId)]
    }

    static removeStyleSheets() {
        let sheet
        while ((sheet = state.styleSheets.pop())) {
            DocumentPreProcessor.removeStyleSheet({id: sheet.id})
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

        if (callback && typeof callback === 'function') return callback(err, state.document)
        return state.document
    }
}


export default DocumentPreProcessor
