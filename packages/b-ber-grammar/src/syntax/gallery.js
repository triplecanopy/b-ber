import {build} from '@canopycanopycanopy/b-ber-lib/utils'
import renderFactory from './factory/block'
import {attributes, htmlId} from './helpers'
import plugin from '../parsers/gallery'

// define our open and closing markers, used by the `validateOpen` and
// `validateClose` methods in the `renderFactory`
const markerOpen = /^(gallery)(?::([^\s]+)(\s.*)?)?$/
const markerClose = /^(exit)(?::([^\s]+))?/

// a simple `render` function that gets passed into our `renderFactory` is
// responsible for the HTML output.
const render = (tokens, idx) => {
    const open = tokens[idx].info.trim().match(markerOpen)
    let result = ''

    if (tokens[idx].nesting === 1 && open) {
        const [, type, id, attrs] = open
        const attrsString = attributes(attrs, type)

        // gallery directive is handled differentenly based on build:

        //  web: drop all assets (images, videos, etc) into a `fullscreen`
        //      container so that they can be positioned using custom CSS

        //  epub, mobi: drop all assets into a section.gallery container
        //      that is initialized as a slider via JS if available.
        //      defaults to a simple sequence of images

        //  pdf: sequence of images

        switch (build()) {
            case 'web':
                result = `
                    <div class="figure__large figure__inline figure__fullbleed">
                        <figure id="${htmlId(id)}">
                            <div class="figure__items">`
                break
            case 'epub':
            case 'mobi':
            case 'pdf':
            case 'sample':
            default:
                result = `\n<section id="${htmlId(id)}" class="gallery"${attrsString}>`
                break
        }
    }

    return result
}

export default {
    plugin,
    name: 'gallery',
    renderer: args =>
        renderFactory({
            ...args,
            markerOpen,
            markerClose,
            render,
        }),
}
