import state from '@canopycanopycanopy/b-ber-lib/State'
import { Html, Url } from '@canopycanopycanopy/b-ber-lib'
import {
  getMediaType,
  renderCaption,
  renderPosterImage,
  ensureSource,
  ensurePoster,
  ensureSupportedClassNames,
} from '@canopycanopycanopy/b-ber-lib/utils'
import {
  attributesString,
  attributesObject,
  htmlId,
} from '@canopycanopycanopy/b-ber-grammar-attributes'
import { htmlIframeAttributes } from '@canopycanopycanopy/b-ber-shapes-directives'

export function supported(build) {
  return build === 'reader' || build === 'web'
}

export function prepare({
  token,
  marker,
  context,
  instance,
  fileName,
  lineNumber,
}) {
  const [, type, id, attrs] = marker
  const mediaType = getMediaType(type)
  const figureId = htmlId(id)
  const page = `figure-${figureId}.xhtml`

  const attrsObject = {
    source: '',
    height: 150,
    width: '100%',
    title: '',
    classes: '',
    poster: '',
    ...attributesObject(attrs, type, { fileName, lineNumber }),
  }

  ensureSource(attrsObject, type, fileName, lineNumber)
  ensurePoster(attrsObject, type)
  ensureSupportedClassNames(attrsObject, supported)

  return {
    ...attrsObject,
    id: figureId,
    attrString: attributesString(attrsObject, { classes: true }),
    commentStart: Html.comment(`START: ${mediaType}:${type}#${figureId};`),
    commentEnd: Html.comment(`END: ${mediaType}:${type}#${figureId};`),
    href: state.build === 'reader' ? 'figures-titlepage.xhtml' : page,
    ref: context.fileName,
    caption: token.children ? instance.renderInline(token.children) : '',
    page,
    type,
    mediaType,
    mime: null,
    pageOrder: state.figures.length,
    source: Url.ensureDecoded(attrsObject.source),
    poster: attrsObject.poster,
  }
}

export function createIframe({ id, href, poster }) {
  return `
    <div class="figure__small figure__small--landscape">
      <figure id="ref${id}">
        <a href="${href}#${id}">
          ${renderPosterImage(poster)}
        </a>
      </figure>
    </div>`
}

export function createIframeInline(data) {
  const {
    id,
    commentStart,
    commentEnd,
    mediaType,
    attrString: containerAttrsString,
    source,
    caption,
    ...rest
  } = data

  const defaults = { allow: 'fullscreen autoplay', frameborder: '0' }
  const iframeAttrs = Object.entries({ ...defaults, ...rest }).reduce(
    (acc, [key, val]) => {
      if (!htmlIframeAttributes.has(key) || val === '') return acc
      return acc.concat(`${key}="${val}"`)
    },
    []
  )
  const iframeAttrsString = iframeAttrs.join(' ')

  return `
    ${commentStart}
      <section class="${mediaType} figure__large figure__inline">
        <div id="${id}"${containerAttrsString}>
          <iframe src="${source}" ${iframeAttrsString}>
          </iframe>
        </div>
        ${renderCaption(caption, mediaType)}
      </section>
    ${commentEnd}`
}
