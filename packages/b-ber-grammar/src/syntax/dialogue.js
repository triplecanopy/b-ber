import plugin from '../parsers/dialogue'
import renderFactory from './factory/block'
import { attributes, htmlId } from './helpers'

// define our open and closing markers, used by the `validateOpen` and
// `validateClose` methods in the `renderFactory`
const MARKER_OPEN_RE = /^(dialogue)(?::([^\s]+)(\s.*)?)?$/
const MARKER_CLOSE_RE = /^(exit)(?::([^\s]+))?/

function handleOpen(token) {
    const [, type, id, attrs] = token
    const attrsString = attributes(attrs, type)
    return `<section id="${htmlId(id)}" ${attrsString}>`
}

function handleClose() {
    return '</section>'
}

// a simple `render` function that gets passed into our `renderFactory` is
// responsible for the HTML output.
const render = (tokens, idx) => {
    if (tokens[idx].nesting !== 1) return ''

    const marker = tokens[idx].info.trim()
    const tokenOpen = marker.match(MARKER_OPEN_RE)

    return tokenOpen ? handleOpen(tokenOpen) : handleClose()
}

export default {
    plugin,
    name: 'dialogue',
    renderer: args =>
        renderFactory({
            ...args,
            markerOpen: MARKER_OPEN_RE,
            markerClose: MARKER_CLOSE_RE,
            render,
        }),
}
