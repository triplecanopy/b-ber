import state from '@canopycanopycanopy/b-ber-lib/State'
import renderFactory from './factory/block'
import { attributes, htmlId } from './helpers'
import plugin from '../parsers/gallery'

// define our open and closing markers, used by the `validateOpen` and
// `validateClose` methods in the `renderFactory`
const markerOpen = /^(spread)(?::([^\s]+)(\s.*)?)?$/
const markerClose = /^(exit)(?::([^\s]+))?/

// a simple `render` function that gets passed into our `renderFactory` is
// responsible for the HTML output.
const render = (tokens, idx) => {
    const open = tokens[idx].info.trim().match(markerOpen)
    let result = ''

    if (tokens[idx].nesting === 1 && open) {
        const [, type, id, attrs] = open
        const attrsString = attributes(attrs, type)

        // spread directive is handled differentenly based on build:

        //  web: drop all assets (images, videos, etc) into a `fullscreen`
        //      container so that they can be positioned using custom CSS

        //  epub, mobi: drop all assets into a section.spread container
        //      that is initialized as a slider via JS if available.
        //      defaults to a simple sequence of images

        //  pdf: sequence of images

        switch (state.build) {
            case 'web':
            case 'reader':
                result = `
                    <div class="spread">
                        <div id="${htmlId(id)}" class="spread__content">`
                break
            case 'epub':
            case 'mobi':
            case 'pdf':
            case 'sample':
            default:
                result = `\n<section id="${htmlId(
                    id
                )}" class="spread"${attrsString}>`
                break
        }
    }

    return result
}

export default {
    plugin,
    name: 'spread',
    renderer: args =>
        renderFactory({
            ...args,
            markerOpen,
            markerClose,
            render,
        }),
}
