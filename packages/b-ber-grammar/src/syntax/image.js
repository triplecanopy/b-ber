import path from 'path'
import fs from 'fs-extra'
import mime from 'mime-types'
import imageSize from 'probe-image-size'
import log from '@canopycanopycanopy/b-ber-logger'
import state from '@canopycanopycanopy/b-ber-lib/State'
import figTmpl from '@canopycanopycanopy/b-ber-templates/figures'
import {getImageOrientation, htmlComment, build} from '@canopycanopycanopy/b-ber-lib/utils'
import {INLINE_DIRECTIVE_MARKER, INLINE_DIRECTIVE_MARKER_MIN_LENGTH} from '@canopycanopycanopy/b-ber-shapes/directives'
import {attributesObject, htmlId} from './helpers'
import figure from '../parsers/figure'

const imageOpenRegExp = /(figure(?:-inline)?)(?::([^\s]+)(\s?.*)?)?$/

export default {
    plugin: figure,
    name: 'figure',
    renderer: ({instance, context = { filename: ''} }) => ({
        marker: INLINE_DIRECTIVE_MARKER,
        minMarkers: INLINE_DIRECTIVE_MARKER_MIN_LENGTH,
        markerOpen: imageOpenRegExp,

        validate(params, line) {
            const match = params.trim().match(imageOpenRegExp)
            if (!match) return false

            const [, , id, source] = match
            if (typeof id === 'undefined' || typeof source === 'undefined') { // image requires `id` and `source`
                log.error(`Missing [id] or [source] attribute for [figure] directive${context.filename}.md:${line}`)
                return false
            }
            return match
        },

        render(tokens, idx) {
            const filename = `_markdown/${context.filename}.md`
            const lineNr = tokens[idx].map ? tokens[idx].map[0] : null

            const match = tokens[idx].info.trim().match(imageOpenRegExp)
            const [, type, id, attrs] = match
            const children = tokens[idx].children
            const caption = children ? instance.renderInline(tokens[idx].children) : ''
            const comment = htmlComment(`START: figure:${type}#${htmlId(id)}; ${filename}:${lineNr}`)
            const attrsObject = attributesObject(attrs, type, {filename, lineNr})
            const asset = path.join(state.src, '_images', attrsObject.source)

            let result, page, classNames, ref, imageData // eslint-disable-line one-var

            // make sure image exists ...
            try {
                if (!fs.existsSync(asset)) {
                    throw new Error(`Image not found [${asset}]`)
                }
            } catch (err) {
                log.error(err.message)
                result = htmlComment(`Image not found [${asset}]`)
                return result
            }

            // then get the dimensions
            const dimensions = imageSize.sync(fs.readFileSync(asset))
            const {width, height} = dimensions
            const figureId = htmlId(id) //`_${crypto.randomBytes(20).toString('hex')}`

            switch (type) {
                case 'figure':
                    classNames = `figure__small figure__small--${getImageOrientation(width, height)}`
                    ref = context.filename

                    if ({}.hasOwnProperty.call(attrsObject, 'classes')) {
                        attrsObject.classes += ` ${classNames}`
                    } else {
                        attrsObject.classes = classNames
                    }

                    page = `figure${figureId}.xhtml`
                    state.add('figures', {
                        id: figureId,
                        ...attrsObject,
                        ...dimensions,
                        page,
                        ref,
                        caption,
                        pageOrder: state.figures.length,
                        mime: mime.lookup(attrsObject.source),
                    })

                    result = `${comment}<div class="${attrsObject.classes}">
                            <figure id="ref${figureId}">
                                <a href="${page}#${figureId}">
                                    <img src="../images/${encodeURIComponent(attrsObject.source)}" alt="${attrsObject.alt}"/>
                                </a>
                            </figure>
                        </div>`
                    break
                case 'figure-inline':
                    if (!{}.hasOwnProperty.call(attrsObject, 'classes')) {
                        attrsObject.classes  = ''
                    }

                    imageData = {
                        ...attrsObject,
                        id: figureId,
                        width,
                        height,
                        caption,
                        inline: true,
                        mime: mime.lookup(attrsObject.source),
                    }

                    result = figTmpl(imageData, state.build)
                    break
                default:
                    break
            }

            return result
        },
    }),
}