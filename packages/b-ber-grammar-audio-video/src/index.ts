import path from 'node:path'
import {
  attributesList,
  attributesObject,
  attributesString,
  htmlId,
  toAlias,
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
import has from 'lodash/has'
import {
  createIFrame,
  createLocalMediaSources,
  createMedia,
  createMediaInline,
  createRemoteMediaSource,
  getMediaType,
  getWebOnlyAttributesString,
  isHostedBySupportedThirdParty,
  isHostedRemotely,
  localMediaSources,
  type MediaType,
  remoteMediaSource,
  validateLocalMediaSource,
  validatePosterImage,
  webOnlyAttributes,
} from './helpers'

const MARKER_RE = /^(video|audio)/
const DIRECTIVE_RE =
  /(audio(?:-inline)?|video(?:-inline)?)(?::([^\s]+)(\s+.*)?)?$/

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
  let [, type] = marker
  const [, , id, attrs] = marker
  // DIRECTIVE_RE only matches audio(-inline) and video(-inline)
  const mediaType = getMediaType(type) as MediaType

  const attrsObject = attributesObject(attrs, type, { fileName, lineNumber })
  const media = [...env.document[mediaType]]
  const caption = node.caption ? instance.renderInline(node.caption, env) : ''

  let sources = []
  let sourceElements = ''
  let sourceList: [string, string][] = []
  let err = null
  let poster = ''
  // let provider = null
  let aspectRatio = '16x9'
  let aspectRatioClassName = ''

  if (attrsObject.poster) {
    poster = validatePosterImage(attrsObject.poster, type, env)
    poster = `../images/${encodeURIComponent(path.basename(poster))}`
    attrsObject.poster = poster
  }

  const { source } = attrsObject
  if (!source)
    throw log.error(
      `Directive [${type}] requires a [source] attribute at [${fileName}:${lineNumber}]`
    )

  if (!has(attrsObject, 'controls')) {
    // Add controls attr by default for audio and video
    attrsObject.controls = 'controls'
  }

  // Allow for custom controls where the target has live embeds and the value
  // is a string. Everything else gets `controls=controls` for epub validation.
  // The value `controls=no` gets stripped out in b-ber-grammar-attributes.
  if (!env.document.target.features.liveEmbeds) {
    attrsObject.controls =
      attrsObject.controls === 'no' ? attrsObject.controls : 'controls'
  }

  if (isHostedRemotely(source)) {
    const supportedThirdParty = isHostedBySupportedThirdParty(source)
    if (supportedThirdParty) {
      // ;[, provider] = supportedThirdParty
      type = type.replace(/(audio|video)/, 'iframe') // iframe, iframe-inline
    } else {
      sources = [source]
      sourceElements = createRemoteMediaSource(sources)
      sourceList = remoteMediaSource(sources)
    }

    env.result.remoteAssets.push(source)
  } else if (validateLocalMediaSource(source, mediaType, env)) {
    sources = media.filter((a) => toAlias(a) === source)
    sourceElements = createLocalMediaSources(sources)
    sourceList = localMediaSources(sources)
  }

  if (!sources.length && type !== 'iframe' && type !== 'iframe-inline') {
    err = new Error(
      `bber-directives: Could not find matching [${mediaType}] with the basename [${source}]`
    )
    throw log.error(err)
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
  const attributes = attributesList(attrsObject)
  const webOnlyAttrString = getWebOnlyAttributesString(env)
  const commentStart = Html.comment(`START: ${mediaType}:${type}#${figureId};`)
  const commentEnd = Html.comment(`END: ${mediaType}:${type}#${figureId};`)
  const page = `figure-${figureId}.xhtml`
  const href =
    env.document.target.features.figuresOn === 'titlepage'
      ? 'figures-titlepage.xhtml'
      : page

  // The figure collected for the list of illustrations, whose template takes
  // the media element's attributes and sources as markup, and what the inline
  // element is built with: the same, unescaped, for the serializer to escape
  const data = {
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
    ref: env.document.fileName,
    mediaType,
    mime: mediaType,
    pageOrder: nextFigure(env),
    poster,
    source,
    type,
    controls: attrsObject.controls,
  }
  return {
    data,
    element: {
      attributes: [...attributes, ...webOnlyAttributes(env)],
      sources: sourceList,
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
      case 'iframe':
      case 'audio':
      case 'video':
        // Collect it so that it's rendered as a `figure`
        env.result.figures.push(data)
        return createMedia(data, h)

      case 'iframe-inline':
        return createIFrame(data, h)

      case 'audio-inline':
      case 'video-inline':
        return createMediaInline(data, element, h)

      default:
        throw new Error(
          `Something went wrong parsing [${data.source}] in [${env.document.fileName}]`
        )
    }
  }

export default {
  plugin: figure,
  name: 'audio-video',
  renderer: ({ instance }: RendererReference) => ({
    marker: INLINE_DIRECTIVE_MARKER,
    minMarkers: INLINE_DIRECTIVE_MARKER_MIN_LENGTH,
    validate: (params: string) => params.trim().match(MARKER_RE),
    render: render({ instance }),
  }),
}
