// we can't use our nice factory for this because it doesn't support
// customized closing elements (always outputs `</section>`), so we have to
// write it long-hand. see comments below

import state from '@canopycanopycanopy/b-ber-lib/State'
import log from '@canopycanopycanopy/b-ber-logger'
import has from 'lodash/has'
import { BLOCK_DIRECTIVE_MARKER, BLOCK_DIRECTIVE_MARKER_MIN_LENGTH } from '@canopycanopycanopy/b-ber-shapes/directives'
import plugin from '../parsers/section'
import { attributesObject, attributesString } from './helpers/attributes'

const MARKER_OPEN_RE = /^(pullquote|blockquote|exit)(?::([^\s]+)(\s.*)?)?$/
const MARKER_CLOSE_RE = /(exit)(?::([\s]+))?/

let citation = ''
const pullquoteIndices = [] // track these separately

function handleOpen(token, fileName, lineNumber) {
    // the pullquote opens
    const [, type, id, attrs] = token

    // we could just state the id in a variable outside of `render`, but
    // good to keep consistent with the normal handling
    const index = state.indexOf('cursor', { id })
    if (index > -1) log.error(`Duplicate [id] [${id}]. [id] must be unique at [${context.fileName}.md:${lineNumber}]`)

    pullquoteIndices.push({ id, type })

    // parse attrs as normal
    const attrsObject = attributesObject(attrs, type, { fileName, lineNumber })

    // get citation which we'll use below
    if (has(attrsObject, 'citation')) {
        ;({ citation } = attrsObject)
        delete attrsObject.citation
    }

    const attrsString = attributesString(attrsObject)
    const elementName = type === 'pullquote' ? 'section' : 'blockquote'
    const comment = `<!-- START: section:${type}#${id} -->`

    return `${comment}<${elementName}${attrsString}>`
}

function cite(text) {
    return `<footer><cite>&#8212;&#160;${text}</cite></footer>`
}

function handleClose(token, instance) {
    // it's an exit to a pullquote. grab the id from the list of
    // indices

    const { id, type } = pullquoteIndices[pullquoteIndices.length - 1]
    const elementName = type === 'pullquote' ? 'section' : 'blockquote'

    // check that the id matches our token
    if (!id || !token.match(new RegExp(`exit:${id}`))) return ''

    let result = ''

    // it's a match for the exit directive's `id`, output the citation
    // with the HTML comment and reset the citation to prepare for the
    // next iteration
    const comment = `<!-- END: section:${type}#${id} -->`

    result = `
        ${citation ? cite(instance.renderInline(citation)) : ''}
        </${elementName}>${comment}
    `

    citation = ''

    // update indices
    pullquoteIndices.pop()

    return result
}

const validateOpen = ({ context }) => (params, line) => {
    const match = params.trim().match(MARKER_OPEN_RE)
    if (!match || match.length < 3) return false

    const [, , id] = match
    if (typeof id === 'undefined') {
        log.error(`Missing [id] for [${exports.default.name}:start] at ${context.fileName}.md:${line}`)
        return false
    }

    return true
}

const render = ({ instance, context }) => (tokens, idx) => {
    const fileName = `_markdown/${context.fileName}.md`
    const lineNumber = tokens[idx].map ? tokens[idx].map[0] : null
    const token = tokens[idx].info.trim()

    // we handle opening and closing render methods on element open, since
    // we need to append data (citation blocks) from the directive's opening
    // attributes to the end of the element
    if (tokens[idx].nesting !== 1) return ''

    // either a `pullquote`, `blockquote` or an `exit` directive, we
    // keep matches for both in `open` and `close` vars below
    const tokenOpen = token.match(MARKER_OPEN_RE)
    const tokenClose = token.match(MARKER_CLOSE_RE)

    return tokenClose ? handleClose(token, instance) : tokenOpen ? handleOpen(tokenOpen, fileName, lineNumber) : ''
}

export default {
    plugin,
    name: 'pullQuote',
    renderer: ({ instance, context }) => ({
        marker: BLOCK_DIRECTIVE_MARKER,
        minMarkers: BLOCK_DIRECTIVE_MARKER_MIN_LENGTH,
        markerOpen: MARKER_OPEN_RE,
        markerClose: MARKER_CLOSE_RE,
        validateOpen: validateOpen({ context }),
        render: render({ instance, context }),
    }),
}
