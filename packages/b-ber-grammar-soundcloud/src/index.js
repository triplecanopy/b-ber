import path from 'path'
import { Html } from '@canopycanopycanopy/b-ber-lib'
import state from '@canopycanopycanopy/b-ber-lib/State'
import log from '@canopycanopycanopy/b-ber-logger'
import {
  INLINE_DIRECTIVE_MARKER,
  INLINE_DIRECTIVE_MARKER_MIN_LENGTH,
} from '@canopycanopycanopy/b-ber-shapes-directives'
import figure from '@canopycanopycanopy/b-ber-parser-figure'
import {
  attributesQueryString,
  attributesString,
  attributesObject,
  htmlId,
} from '@canopycanopycanopy/b-ber-grammar-attributes'
import {
  validatePosterImage,
  createSoundcloud,
  createSoundcloudInline,
  createUnsupportedInline,
  getMediaType,
  bBerAttributes,
  transformAttributes,
  soundcloudAttributesTransformer,
} from './helpers'

const MARKER_RE = /^(soundcloud)/
const DIRECTIVE_RE = /(soundcloud(?:-inline)?)(?::([^\s]+)(\s+.*)?)?$/

function supported(build) {
  return build === 'reader' || build === 'web'
}

function prepare({ token, marker, context, instance, fileName, lineNumber }) {
  const [, type, id, attrs] = marker
  const mediaType = getMediaType(type)
  const attrsObject = attributesObject(attrs, type, { fileName, lineNumber })
  const caption = token.children ? instance.renderInline(token.children) : ''

  if (!attrsObject.url)
    log.error(
      `Directive [${type}] requires a [url] attribute at [${fileName}:${lineNumber}]`
    )

  // Set update poster image path or set to empty string if one wasn't specified
  if (attrsObject.poster) {
    validatePosterImage(attrsObject.poster, type)
    attrsObject.poster = `../images/${encodeURIComponent(
      path.basename(attrsObject.poster)
    )}`
  } else {
    attrsObject.poster = ''
  }

  // Add mediaType to classes
  if (!attrsObject.classes) attrsObject.classes = ''
  const supportedPrefix = supported(state.build) ? '' : 'un'
  attrsObject.classes += ` embed ${supportedPrefix}supported`

  const figureId = htmlId(id)
  const attrString = attributesString(attrsObject, bBerAttributes)
  const soundcloudAttributesObject = transformAttributes(
    attrsObject,
    soundcloudAttributesTransformer
  )
  const attrQuery = attributesQueryString(soundcloudAttributesObject)
  const commentStart = Html.comment(`START: ${mediaType}:${type}#${figureId};`)
  const commentEnd = Html.comment(`END: ${mediaType}:${type}#${figureId};`)

  const page = `figure-${figureId}.xhtml`
  const href = state.build === 'reader' ? 'figures-titlepage.xhtml' : page

  return {
    id: figureId,
    attrString,
    attrQuery,
    commentStart,
    commentEnd,
    page,
    href,
    caption,
    ref: context.fileName,
    mediaType,
    mime: null,
    pageOrder: state.figures.length,
    poster: attrsObject.poster,
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
    // Render the linked image and add the figure to state so that it's rendered
    // in the LOI
    case 'soundcloud':
      state.add('figures', args)
      return createSoundcloud(args)

    // Render an inline Soundcloud embed, or an unsupported message if not
    // running a reader or web build
    case 'soundcloud-inline':
      return supported(state.build)
        ? createSoundcloudInline(args)
        : createUnsupportedInline(args)

    default:
      throw new Error(
        `Something went wrong parsing [${args.type}] in [${context.fileName}]`
      )
  }
}

export default {
  plugin: figure,
  name: 'soundcloud',
  renderer: ({ instance, context }) => ({
    marker: INLINE_DIRECTIVE_MARKER,
    minMarkers: INLINE_DIRECTIVE_MARKER_MIN_LENGTH,
    validate: params => params.trim().match(MARKER_RE),
    render: render({ instance, context }),
  }),
}
