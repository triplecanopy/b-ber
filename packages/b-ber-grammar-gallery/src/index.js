import state from '@canopycanopycanopy/b-ber-lib/State'
import createRenderer from '@canopycanopycanopy/b-ber-grammar-renderer'
import { htmlId, attributesObject, attributesString } from '@canopycanopycanopy/b-ber-grammar-attributes'
import plugin from '@canopycanopycanopy/b-ber-parser-gallery'

// define our open and closing markers, used by the `validateOpen` and
// `validateClose` methods in the `createRenderer`
const MARKER_OPEN_RE = /^(gallery)(?::([^\s]+)(\s.*)?)?$/
const MARKER_CLOSE_RE = /^(exit)(?::([^\s]+))?/

// a simple `render` function that gets passed into our `createRenderer` is
// responsible for the HTML output.
const render = (tokens, idx) => {
    const token = tokens[idx].info.trim().match(MARKER_OPEN_RE)

    if (tokens[idx].nesting !== 1 || !token) return ''

    const [, type, id, attrs] = token
    const attrsObject = attributesObject(attrs, type)
    const attrsString = attributesString(attrsObject)

    // gallery directive is handled differentenly based on build:

    //  web: drop all assets (images, videos, etc) into a `fullscreen`
    //      container so that they can be positioned using custom CSS

    //  epub, mobi: drop all assets into a section.gallery container
    //      that is initialized as a slider via JS if available.
    //      defaults to a simple sequence of images

    //  pdf: sequence of images

    switch (state.build) {
        case 'web':
        case 'reader':
            return `
                <section id="${htmlId(id)}" ${attrsString}>
                <div class="figure__large figure__inline figure__fullbleed figure__gallery">
                <figure>
                <div class="figure__items">`
        case 'epub':
        case 'mobi':
        case 'pdf':
        case 'sample':
        default:
            return `<section id="${htmlId(id)}" ${attrsString}>`
    }
}

export default {
    plugin,
    name: 'gallery',
    renderer: args =>
        createRenderer({
            ...args,
            markerOpen: MARKER_OPEN_RE,
            markerClose: MARKER_CLOSE_RE,
            render,
        }),
}
