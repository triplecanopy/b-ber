import path from 'node:path'
import {
  attributesObject,
  attributesString,
  htmlId,
} from '@canopycanopycanopy/b-ber-grammar-attributes'
import {
  type DocumentEnv,
  type FigureToken,
  Html,
  nextFigure,
  type RendererReference,
  Url,
  utils,
} from '@canopycanopycanopy/b-ber-lib'
import log from '@canopycanopycanopy/b-ber-logger'
import { htmlIframeAttributes } from '@canopycanopycanopy/b-ber-shapes-directives'
import fs from 'fs-extra'

// Read from the package root rather than the `b-ber-lib/utils` subpath: that
// subpath is a bare `utils.js` shim with no declaration file, and it re-exports
// this same `utils` object.
const { ensureSource, getMediaType, renderCaption, renderPosterImage } = utils

// b-ber-lib's `ensurePoster` and `ensureSupportedClassNames`, which read the
// project's images and the target from `State`, taking them from the
// document instead (TASK-177)
function ensurePoster(
  obj: { poster?: string },
  type: string,
  env: DocumentEnv
): void {
  if (!obj.poster) return

  if (!fs.existsSync(env.document.images(obj.poster))) {
    throw log.error(
      `bber-directives: Poster image for [${type}] does not exist`
    )
  }
  obj.poster = `../images/${encodeURIComponent(path.basename(obj.poster))}`
}

// Marks an embed as live or not in the target being built
function ensureSupportedClassNames(
  obj: { classes?: string },
  env: DocumentEnv
): void {
  const { liveEmbeds } = env.document.target.features
  obj.classes += ` embed ${liveEmbeds ? '' : 'un'}supported`
}

interface PrepareArgs extends RendererReference {
  env: DocumentEnv
  token: FigureToken
  marker: RegExpMatchArray
  fileName: string
  lineNumber: number | null
}

export function prepare({
  token,
  marker,
  env,
  instance,
  fileName,
  lineNumber,
}: PrepareArgs) {
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
  ensurePoster(attrsObject, type, env)
  ensureSupportedClassNames(attrsObject, env)

  return {
    ...attrsObject,
    id: figureId,
    attrString: attributesString(attrsObject, { classes: true }),
    commentStart: Html.comment(`START: ${mediaType}:${type}#${figureId};`),
    commentEnd: Html.comment(`END: ${mediaType}:${type}#${figureId};`),
    href:
      env.document.target.features.figuresOn === 'titlepage'
        ? 'figures-titlepage.xhtml'
        : page,
    ref: env.document.fileName,
    caption: token.children ? instance.renderInline(token.children, env) : '',
    page,
    type,
    mediaType,
    mime: null,
    pageOrder: nextFigure(env),
    source: Url.ensureDecoded(attrsObject.source),
    poster: attrsObject.poster,
  }
}

export type IframeArgs = ReturnType<typeof prepare>

export function createIframe({
  id,
  href,
  poster,
}: Pick<IframeArgs, 'id' | 'href' | 'poster'>): string {
  return `
    <div class="figure__small figure__small--landscape">
      <figure id="ref${id}">
        <a href="${href}#${id}">
          ${renderPosterImage(poster)}
        </a>
      </figure>
    </div>`
}

export function createIframeInline(data: IframeArgs): string {
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

  // TODO(TASK-056): 'frameborder' is not a valid EPUB 3 attribute and causes
  // EPUBCheck errors. Remove once the iframe template is EPUB 3 compliant.
  // const defaults = { allow: 'fullscreen autoplay', frameborder: '0' }
  const defaults = { allow: 'fullscreen autoplay' }
  const iframeAttrs = Object.entries({ ...defaults, ...rest }).reduce<string[]>(
    (acc, [key, val]) => {
      if (!htmlIframeAttributes.has(key) || val === '') return acc
      return acc.concat(`${key}="${Html.escape(val)}"`)
    },
    []
  )
  const iframeAttrsString = iframeAttrs.join(' ')

  return `
    ${commentStart}
      <section class="${mediaType} figure__large figure__inline">
        <div id="${id}"${containerAttrsString}>
          <iframe src="${Html.escape(source)}" ${iframeAttrsString}>
          </iframe>
        </div>
        ${renderCaption(caption, mediaType)}
      </section>
    ${commentEnd}`
}
