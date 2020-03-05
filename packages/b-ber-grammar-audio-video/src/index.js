import path from 'path'
import has from 'lodash.has'
import { Html } from '@canopycanopycanopy/b-ber-lib'
import state from '@canopycanopycanopy/b-ber-lib/State'
import log from '@canopycanopycanopy/b-ber-logger'
import {
  INLINE_DIRECTIVE_MARKER,
  INLINE_DIRECTIVE_MARKER_MIN_LENGTH,
} from '@canopycanopycanopy/b-ber-shapes-directives'
import figure from '@canopycanopycanopy/b-ber-parser-figure'
import {
  attributesString,
  attributesObject,
  htmlId,
  toAlias,
} from '@canopycanopycanopy/b-ber-grammar-attributes'
import {
  isHostedRemotely,
  isHostedBySupportedThirdParty,
  validatePosterImage,
  validateLocalMediaSource,
  createLocalMediaSources,
  createRemoteMediaSource,
  getWebOnlyAttributesString,
  createMedia,
  createIFrame,
  createMediaInline,
  getMediaType,
} from './helpers'

const MARKER_RE = /^(video|audio)/
const DIRECTIVE_RE = /(audio(?:-inline)?|video(?:-inline)?)(?::([^\s]+)(\s+.*)?)?$/

function prepare({ token, marker, context, instance, fileName, lineNumber }) {
  let [, type] = marker
  const [, , id, attrs] = marker
  const mediaType = getMediaType(type)

  const attrsObject = attributesObject(attrs, type, { fileName, lineNumber })
  const media = [...state[mediaType]]
  const caption = token.children ? instance.renderInline(token.children) : ''

  let sources = []
  let sourceElements = ''
  let err = null
  let poster = ''
  let provider = null // eslint-disable-line no-unused-vars
  let aspectRatio = '16x9'
  let aspectRatioClassName = ''

  if (attrsObject.poster) {
    poster = validatePosterImage(attrsObject.poster, type)
    poster = `../images/${encodeURIComponent(path.basename(poster))}`
    attrsObject.poster = poster
  }

  const { source } = attrsObject
  if (!source)
    log.error(
      `Directive [${type}] requires a [source] attribute at [${fileName}:${lineNumber}]`
    )

  if (!has(attrsObject, 'controls')) {
    // Add controls attr by default for audio and video
    attrsObject.controls = 'controls'
  }

  // Allow for custom controls for reader and web builds where the value is a
  // string, all other builds set to `controls=controls` for epub validation.
  // The value `controls=no` gets stripped out in b-ber-grammar-attributes.
  if (state.build !== 'reader' && state.build !== 'web') {
    attrsObject.controls =
      attrsObject.controls === 'no' ? attrsObject.controls : 'controls'
  }

  if (isHostedRemotely(source)) {
    const supportedThirdParty = isHostedBySupportedThirdParty(source)
    if (supportedThirdParty) {
      ;[, provider] = supportedThirdParty
      type = type.replace(/(audio|video)/, 'iframe') // iframe, iframe-inline
    } else {
      sources = [source]
      sourceElements = createRemoteMediaSource(sources)
    }

    state.add('remoteAssets', source)
  } else if (validateLocalMediaSource(source, mediaType)) {
    sources = media.filter(a => toAlias(a) === source)
    sourceElements = createLocalMediaSources(sources)
  }

  if (!sources.length && type !== 'iframe' && type !== 'iframe-inline') {
    err = new Error(
      `bber-directives: Could not find matching [${mediaType}] with the basename [${source}]`
    )
    log.error(err)
  }

  delete attrsObject.source // otherwise we get a `src` tag on our video element
  if (mediaType === 'audio') {
    delete attrsObject.poster // invalid attr for audio elements
  }

  if (mediaType === 'video') {
    // TODO: needs to be done async
    //
    // add aspect ratio class name
    // const aspectRatioClassName = isHostedRemotely(source)
    //     ? getVideoAspectRatio()
    //     : getVideoAspectRatio(path.resolve(state.src.media(head(sources))))

    // Ensure an aspect ratio is set, default to 16:9
    const { aspectratio } = attrsObject
    if (aspectratio) aspectRatio = aspectratio

    aspectRatioClassName = `video--${aspectRatio}`
    delete attrsObject.aspectratio
  }

  const figureId = htmlId(id)
  const attrString = attributesString(attrsObject)
  const webOnlyAttrString = getWebOnlyAttributesString()
  const commentStart = Html.comment(`START: ${mediaType}:${type}#${figureId};`)
  const commentEnd = Html.comment(`END: ${mediaType}:${type}#${figureId};`)
  const page = `figure-${figureId}.xhtml`
  const href = state.build === 'reader' ? 'figures-titlepage.xhtml' : page

  return {
    id: figureId,
    attrString,
    webOnlyAttrString,
    commentStart,
    commentEnd,
    page,
    href,
    caption,
    sourceElements,
    aspectRatio,
    aspectRatioClassName,
    ref: context.fileName,
    mediaType,
    mime: mediaType,
    pageOrder: state.figures.length,
    poster,
    source,
    type,
  }
}

const render = ({ instance, context }) => (tokens, index) => {
  const token = tokens[index]
  const marker = token.info.trim().match(DIRECTIVE_RE)
  if (!marker) return ''

  const fileName = `_markdown/${context.fileName}.md`
  const lineNumber = token.map ? token.map[0] : null
  const type = marker[1]
  const args = prepare({
    token,
    marker,
    context,
    instance,
    fileName,
    lineNumber,
  })

  switch (type) {
    case 'iframe':
    case 'audio':
    case 'video':
      // Add it to state so that it's rendered as a `figure`
      state.add('figures', args)
      return createMedia(args)

    case 'iframe-inline':
      return createIFrame(args)

    case 'audio-inline':
    case 'video-inline':
      return createMediaInline(args)

    default:
      throw new Error(
        `Something went wrong parsing [${args.source}] in [${context.fileName}]`
      )
  }
}

export default {
  plugin: figure,
  name: 'audio-video',
  renderer: ({ instance, context }) => ({
    marker: INLINE_DIRECTIVE_MARKER,
    minMarkers: INLINE_DIRECTIVE_MARKER_MIN_LENGTH,
    validate: params => params.trim().match(MARKER_RE),
    render: render({ instance, context }),
  }),
}
