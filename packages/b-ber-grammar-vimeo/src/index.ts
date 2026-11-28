import path from 'node:path'
import {
  attributesList,
  attributesObject,
  attributesQuery,
  attributesQueryString,
  attributesString,
  htmlId,
} from '@canopycanopycanopy/b-ber-grammar-attributes'
import {
  type DocumentEnv,
  Html,
  type InlineDirective,
  type InlineRender,
  nextFigure,
  type RendererReference,
} from '@canopycanopycanopy/b-ber-lib'
import log from '@canopycanopycanopy/b-ber-logger'
import figure from '@canopycanopycanopy/b-ber-parser-figure'
import {
  INLINE_DIRECTIVE_MARKER,
  INLINE_DIRECTIVE_MARKER_MIN_LENGTH,
} from '@canopycanopycanopy/b-ber-shapes-directives'
import {
  bBerAttributes,
  createUnsupportedInline,
  createVimeo,
  createVimeoInline,
  getMediaType,
  transformAttributes,
  validatePosterImage,
  vimeoAttributesTransformer,
} from './helpers'

const MARKER_RE = /^(vimeo)/
const DIRECTIVE_RE = /(vimeo(?:-inline)?)(?::([^\s]+)(\s+.*)?)?$/

interface PrepareArgs extends RendererReference {
  env: DocumentEnv
  node: InlineDirective
  marker: RegExpMatchArray
  fileName: string
  lineNumber: number | null
}

function prepare({
  node,
  marker,
  env,
  instance,
  fileName,
  lineNumber,
}: PrepareArgs) {
  const [, type, id, attrs] = marker
  const mediaType = getMediaType(type)
  const attrsObject = attributesObject(attrs, type, { fileName, lineNumber })
  const caption = node.caption ? instance.renderInline(node.caption, env) : ''

  if (!attrsObject.source)
    throw log.error(
      `Directive [${type}] requires a [source] attribute at [${fileName}:${lineNumber}]`
    )

  // Set update poster image path or set to empty string if one wasn't specified
  if (attrsObject.poster) {
    validatePosterImage(attrsObject.poster, type, env)
    attrsObject.poster = `../images/${encodeURIComponent(
      path.basename(attrsObject.poster)
    )}`
  } else {
    attrsObject.poster = ''
  }

  // Add mediaType to classes
  if (!attrsObject.classes) attrsObject.classes = ''
  const supportedPrefix = env.document.target.features.liveEmbeds ? '' : 'un'
  attrsObject.classes += ` embed ${supportedPrefix}supported`

  // Ensure an aspect ratio is set, default to 16:9
  let aspectRatio = '16x9'
  const { aspectratio } = attrsObject
  if (aspectratio) aspectRatio = aspectratio

  const aspectRatioClassName = `vimeo--${aspectRatio}`
  delete attrsObject.aspectratio

  const figureId = htmlId(id)
  const attrString = attributesString(attrsObject, bBerAttributes)
  const vimeoAttributesObject = transformAttributes(
    attrsObject,
    vimeoAttributesTransformer
  )
  const attrQuery = attributesQueryString(vimeoAttributesObject)
  const commentStart = Html.comment(`START: ${mediaType}:${type}#${figureId};`)
  const commentEnd = Html.comment(`END: ${mediaType}:${type}#${figureId};`)

  const page = `figure-${figureId}.xhtml`
  const href =
    env.document.target.features.figuresOn === 'titlepage'
      ? 'figures-titlepage.xhtml'
      : page

  // The figure collected for the list of illustrations, and what the inline
  // embed's elements are built with besides: its class and its player query
  // string, unescaped, for the serializer to escape
  const data = {
    id: figureId,
    attrString,
    attrQuery,
    commentStart,
    commentEnd,
    page,
    href,
    caption,
    ref: env.document.fileName,
    mediaType,
    mime: null,
    pageOrder: nextFigure(env),
    poster: attrsObject.poster,
    source: attrsObject.source,
    aspectRatio,
    aspectRatioClassName,
    type,
  }
  return {
    data,
    element: {
      attributes: attributesList(attrsObject, bBerAttributes),
      query: attributesQuery(vimeoAttributesObject),
    },
  }
}

const render =
  ({ instance }: RendererReference): InlineRender =>
  ({ node, env, h }) => {
    const marker = node.info.trim().match(DIRECTIVE_RE)
    if (!marker) return h.fragment([])

    const fileName = `_markdown/${env.document.fileName}.md`
    const lineNumber = node.line
    const type = marker[1]
    const { data, element } = prepare({
      node,
      marker,
      env,
      instance,
      fileName,
      lineNumber,
    })

    switch (type) {
      // Render the linked image and collect the figure so that it's rendered
      // in the LOI
      case 'vimeo':
        env.result.figures.push(data)
        return createVimeo(data, h)

      // Render an inline Vimeo embed, or an unsupported message where the
      // target has no live embeds
      case 'vimeo-inline':
        return env.document.target.features.liveEmbeds
          ? createVimeoInline(data, element, env, h)
          : createUnsupportedInline(data, element, h)

      default:
        throw new Error(
          `Something went wrong parsing [${data.source}] in [${env.document.fileName}]`
        )
    }
  }

export default {
  plugin: figure,
  name: 'vimeo',
  renderer: ({ instance }: RendererReference) => ({
    marker: INLINE_DIRECTIVE_MARKER,
    minMarkers: INLINE_DIRECTIVE_MARKER_MIN_LENGTH,
    validate: (params: string) => params.trim().match(MARKER_RE),
    render: render({ instance }),
  }),
}
