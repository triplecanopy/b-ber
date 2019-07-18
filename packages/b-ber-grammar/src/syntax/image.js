import fs from 'fs-extra'
import imageSize from 'probe-image-size'
import log from '@canopycanopycanopy/b-ber-logger'
import { Html } from '@canopycanopycanopy/b-ber-lib'
import state from '@canopycanopycanopy/b-ber-lib/State'
import {
    INLINE_DIRECTIVE_MARKER,
    INLINE_DIRECTIVE_MARKER_MIN_LENGTH,
} from '@canopycanopycanopy/b-ber-shapes/directives'
import { attributesObject, htmlId } from './helpers/attributes'
import { createFigure, createFigureInline } from './helpers/image'
import figure from '../parsers/figure'

const MARKER_OPEN_RE = /(figure(?:-inline)?)(?::([^\s]+)(\s?.*)?)?$/

function prepare({ token, match, instance, context, fileName, lineNumber }) {
    const [, type, id, attrs] = match
    const figureId = htmlId(id)
    const caption = token.children ? instance.renderInline(token.children) : ''
    const comment = Html.comment(`START: figure:${type}#${figureId}; ${fileName}:${lineNumber}`)
    const attrsObject = attributesObject(attrs, type, { fileName, lineNumber })
    const asset = state.src.images(attrsObject.source)
    const mediaType = (type.indexOf('-') && type.substring(0, type.indexOf('-'))) || type

    // make sure image exists
    if (!fs.existsSync(asset)) log.error(`Image not found [${asset}]`)

    // then get the dimensions
    const dimensions = imageSize.sync(fs.readFileSync(asset))

    return { ...dimensions, caption, comment, context, attrsObject, asset, mediaType, id: figureId }
}

const validate = ({ context = { fileName: '' } }) => (params, line) => {
    const match = params.trim().match(MARKER_OPEN_RE)
    if (!match) return false

    const [, , id, source] = match
    if (typeof id === 'undefined' || typeof source === 'undefined') {
        // image requires `id` and `source`
        log.error(`Missing [id] or [source] attribute for [figure] directive${context.fileName}.md:${line}`)
        return false
    }

    return true
}

const render = ({ instance, context }) => (tokens, index) => {
    const token = tokens[index]
    if (token.type === 'container_figure_close') return ''

    const fileName = `_markdown/${context.fileName}.md`
    const lineNumber = token.map ? token.map[0] : null
    const match = token.info.trim().match(MARKER_OPEN_RE)
    const type = match[1]
    const args = prepare({ token, match, instance, context, fileName, lineNumber })

    return type === 'figure' ? createFigure(args) : type === 'figure-inline' ? createFigureInline(args) : ''
}
export default {
    plugin: figure,
    name: 'figure',
    renderer: ({ instance, context = { fileName: '' } }) => ({
        marker: INLINE_DIRECTIVE_MARKER,
        minMarkers: INLINE_DIRECTIVE_MARKER_MIN_LENGTH,
        markerOpen: MARKER_OPEN_RE,
        validate: validate({ context }),
        render: render({ instance, context }),
    }),
}
