import {
  attributesObject,
  attributesString,
  htmlId,
} from '@canopycanopycanopy/b-ber-grammar-attributes'
import { Html, State as state, Url, utils } from '@canopycanopycanopy/b-ber-lib'
import { htmlIframeAttributes } from '@canopycanopycanopy/b-ber-shapes-directives'

// Read from the package root rather than the `b-ber-lib/utils` subpath: that
// subpath is a bare `utils.js` shim with no declaration file, and it re-exports
// this same `utils` object.
const {
  ensurePoster,
  ensureSource,
  ensureSupportedClassNames,
  getMediaType,
  renderCaption,
  renderPosterImage,
} = utils

// The parts of markdown-it's `Token` and `MarkdownIt` that this renderer uses.
// Typed structurally rather than imported from markdown-it: it is not a
// dependency of this package, so tsdown would inline all of its types into
// dist/index.d.ts.
export interface FigureToken {
  info: string
  map: [number, number] | null
  // b-ber-parser-figure stores the raw caption source here, not child tokens
  children?: string | null
}

// `context` is the b-ber-markdown-renderer instance
export interface RendererReference {
  instance: { renderInline: (src: string) => string }
  context: { fileName: string }
}

interface PrepareArgs extends RendererReference {
  token: FigureToken
  marker: RegExpMatchArray
  fileName: string
  lineNumber: number | null
}

export function supported(build: string): boolean {
  return build === 'reader' || build === 'web'
}

export function prepare({
  token,
  marker,
  context,
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
    ...attributesObject(attrs, type, {
      fileName,
      // attributesObject only interpolates lineNumber into log messages, but
      // types it `number | undefined`; it should accept `token.map`'s null
      // biome-ignore lint/suspicious/noExplicitAny: TASK-119 pass 1
      lineNumber: lineNumber as any,
    }),
  }

  // ensureSource only interpolates lineNumber into a log message, but types it
  // `number`; it should accept `token.map`'s null
  // biome-ignore lint/suspicious/noExplicitAny: TASK-119 pass 1
  ensureSource(attrsObject, type, fileName, lineNumber as any)
  ensurePoster(attrsObject, type)
  ensureSupportedClassNames(attrsObject, supported)

  return {
    ...attrsObject,
    id: figureId,
    // attributesString types its input `Record<string, string>`, but the
    // defaults include a numeric `height` (filtered out by the reference here)
    // biome-ignore lint/suspicious/noExplicitAny: TASK-119 pass 1
    attrString: attributesString(attrsObject as any, { classes: true }),
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
