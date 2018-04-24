/* eslint-disable no-mixed-operators, template-curly-spacing */

import fs from 'fs-extra'
import path from 'path'
import mime from 'mime-types'
import {htmlComment, encodeQueryString} from '@canopycanopycanopy/b-ber-lib/utils'
import state from '@canopycanopycanopy/b-ber-lib/State'
import log from '@canopycanopycanopy/b-ber-logger'
import figure from '../parsers/figure'
import {attributesString, attributesObject, htmlId} from './helpers'

const markerRe = /^(video|audio)/
const directiveRe = /(audio(?:-inline)?|video(?:-inline)?)(?::([^\s]+)(\s+.*)?)?$/


const toAlias = fpath => path.basename(path.basename(fpath, path.extname(fpath)))

const isHostedRemotely = asset => /^http/.test(asset)

const isHostedBySupportedThirdParty = asset => asset.match(/(vimeo|youtube)\.com/)

const validatePosterImage = (_asset, type) => {
    const asset = path.join(state.src, '_images', _asset)
    const isInlineMedia = /inline/.test(type)
    try {
        if (!fs.existsSync(asset)) {
            if (isInlineMedia) {
                throw new Error('bber-directives: inline media directives requires a [poster] attribute, aborting', 1)
            } else {
                throw new Error(`bber-directives: Poster image for [${type}] does not exist`)
            }
        }
    } catch (err) {
        log.error(err, Number(isInlineMedia))
    }

    return asset
}

const validateLocalMediaSource = (asset, mediaType) => {
    const media = [...state[mediaType]].map(_ => toAlias(_))
    if (!asset.length || media.indexOf(asset) < 0) {
        const err = new Error(`bber-directives: Could not find [${mediaType}] matching [${asset}], make sure it's included in the [_media] directory`) // eslint-disable-line max-len
        log.error(err)
    }

    return asset
}

const createLocalMediaSources = sources =>
    sources.reduce((acc, curr) => acc.concat(`
        <source src="../media/${path.basename(curr)}" type="${mime.lookup(curr)}"/>
    `), '')

const createRemoteMediaSource = sources =>
    `<source src="${sources[0]}" type="${mime.lookup(sources[0])}"/>`

export default {
    plugin: figure,
    name: 'media',
    renderer: ({instance, context}) => ({
        marker: ':',
        minMarkers: 3,
        validate(params) {
            return params.trim().match(markerRe)
        },
        render(tokens, idx) {
            const match = tokens[idx].info.trim().match(directiveRe)
            if (!match) return ''

            const filename            = `_markdown/${context.filename}.md`
            const lineNr              = tokens[idx].map ? tokens[idx].map[0] : null
            const [, , id, attrs]     = match

            let type                  = match[1]
            const mediaType           = type.indexOf('-') && type.substring(0, type.indexOf('-')) || type

            const attrsObject         = attributesObject(attrs, type, {filename, lineNr})
            const media               = [...state[mediaType]]
            const children            = tokens[idx].children
            const caption             = children ? instance.renderInline(tokens[idx].children) : ''

            let sources               = []
            let sourceElements        = ''
            let err                   = null
            let poster                = ''
            let provider              = null // eslint-disable-line no-unused-vars

            // add controls attr by default
            if (!{}.hasOwnProperty.call(attrsObject, 'controls')) {
                attrsObject.controls = 'controls'
            }

            if (attrsObject.poster) {
                poster = validatePosterImage(attrsObject.poster, type)
                poster = `../images/${encodeURIComponent(path.basename(poster))}`
                attrsObject.poster = poster
            }

            const {source} = attrsObject


            if (!source) {
                err = new Error(`bber-directives: Directive [${type}] requires a [source] attribute, aborting`)
                log.error(err)
            }



            if (isHostedRemotely(source)) {
                const supportedThirdParty = isHostedBySupportedThirdParty(source)
                if (supportedThirdParty) {
                    [, provider] = supportedThirdParty
                    type = type.replace(/(audio|video)/, 'iframe') // iframe, iframe-inline
                } else {
                    sources = [source]
                    sourceElements = createRemoteMediaSource(sources)
                }

                state.add('remoteAssets', source)

            } else if (validateLocalMediaSource(source, mediaType)) {
                sources = media.filter(_ => toAlias(_) === source)
                sourceElements = createLocalMediaSources(sources)
            }


            if (!sources.length && type !== 'iframe' && type !== 'iframe-inline') {
                err = new Error(`bber-directives: Could not find matching [${mediaType}] with the basename [${source}]`)
                log.error(err)
            }



            delete attrsObject.source // otherwise we get a `src` tag on our video element
            if (mediaType === 'audio') {
                delete attrsObject.poster // invalid attr for audio elements
            }


            const figureId = htmlId(id)
            const attrString = attributesString(attrsObject)
            const webOnlyAttrString = state.build === 'web' || state.build === 'reader' ? ' webkit-playsinline="webkit-playsinline" playsinline="playsinline"' : ''
            const commentStart = htmlComment(`START: ${mediaType}:${type}#${figureId};`)
            const commentEnd = htmlComment(`END: ${mediaType}:${type}#${figureId};`)
            const page = `figure-${figureId}.xhtml`
            const href = state.build === 'reader' ? 'figures-titlepage.xhtml' : page

            switch (type) {
                case 'iframe':
                case 'audio':
                case 'video':

                    // add it to state so that it's rendered as a `figure`
                    state.add('figures',
                        {
                            id: figureId,
                            attrString,
                            sourceElements,
                            page,
                            ref: context.filename,
                            caption,
                            mime: mediaType,
                            pageOrder: state.figures.length,
                            poster,
                            mediaType,
                            source,
                            type,
                        }
                    )

                    return `<div class="figure__small figure__small--landscape">
                        <figure id="ref${figureId}">
                            <a href="${href}#${figureId}">
                                <img src="${poster}" alt=""/>
                            </a>
                        </figure>
                    </div>`


                case 'iframe-inline':
                    return `${commentStart}
                        <section id="${figureId}">
                            <iframe src="${encodeQueryString(source)}" />
                            ${caption ? `<p class="caption caption__${mediaType}">${caption}</p>` : ''}
                        </section>
                    ${commentEnd}`

                case 'audio-inline':
                case 'video-inline':
                    return `${commentStart}
                        <section class="${mediaType}">
                            <${mediaType} id="${figureId}"${attrString}${webOnlyAttrString}>
                                ${sourceElements}
                                <div class="media__fallback__${mediaType} media__fallback--image figure__small figure__small--landscape">
                                    <figure>
                                        <img src="${poster}" alt="Media fallback image"/>
                                    </figure>
                                </div>
                                <p class="media__fallback__${mediaType} media__fallback--text">Your device does not support the HTML5 ${mediaType} API.</p>
                            </${mediaType}>
                            ${caption ? `<p class="caption caption__${mediaType}">${caption}</p>` : ''}
                        </section>
                        ${commentEnd}`
                default:
                    throw new Error(`Something went wrong parsing [${source}] in [${context.filename}]`)
            }

        },
    }),
}
