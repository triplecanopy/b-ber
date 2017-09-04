import plugin from 'bber-plugins/md/plugins/dialogue'
import renderFactory from 'bber-plugins/md/directives/factory/block'
import { attributes, attributesObject, htmlId } from 'bber-plugins/md/directives/helpers'

// define our open and closing markers, used by the `validateOpen` and
// `validateClose` methods in the `renderFactory`
const markerOpen = /^(dialogue)(?::([^\s]+)(\s.*)?)?$/
const markerClose = /^(exit)(?::([^\s]+))?/

// a simple `render` function that gets passed into our `renderFactory` is
// responsible for the HTML output.
const render = (tokens, idx) => {
    let result = ''
    if (tokens[idx].nesting === 1) {
        const open = tokens[idx].info.trim().match(markerOpen)
        const close = tokens[idx].info.trim().match(markerClose)
        if (open) {
            const [, type, id, attrs] = open
            const attrsString = attributes(attrs, type)
            result = `\n<section id="${htmlId(id)}" class="dialogue"${attrsString}>`
        }

        if (close) {
            result = '\n</section>'
        }
    }
    return result
}

export default {
    plugin,
    name: 'dialogue',
    renderer: args =>
        renderFactory({
            ...args,
            markerOpen,
            markerClose,
            render,
        }),
}
