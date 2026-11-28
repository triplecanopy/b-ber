import path from 'node:path'
import {
  attributesList,
  attributesObject,
  attributesString,
  commentLines,
  htmlId,
} from '@canopycanopycanopy/b-ber-grammar-attributes'
import {
  type DocumentEnv,
  Html,
  type InlineDirective,
  nextFigure,
  type RendererReference,
  Url,
  utils,
  type XhtmlBuilder,
  type XhtmlNode,
} from '@canopycanopycanopy/b-ber-lib'
import log from '@canopycanopycanopy/b-ber-logger'
import { htmlIframeAttributes } from '@canopycanopycanopy/b-ber-shapes-directives'
import fs from 'fs-extra'

// Read from the package root rather than the `b-ber-lib/utils` subpath: that
// subpath is a bare `utils.js` shim with no declaration file, and it re-exports
// this same `utils` object.
const { ensureSource, getMediaType } = utils

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
  node: InlineDirective
  marker: RegExpMatchArray
  fileName: string
  lineNumber: number | null
}

export function prepare({
  node,
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
    caption: node.caption ? instance.renderInline(node.caption, env) : '',
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

// A line break and the indentation the markup was written with
const nl = (indent: number): string => `\n${' '.repeat(indent)}`

const posterImage = (h: XhtmlBuilder, poster: string): XhtmlNode | null =>
  poster ? h('img', { src: poster, alt: 'Poster Image' }) : null

const startComment = (h: XhtmlBuilder, { mediaType, type, id }: IframeArgs) =>
  commentLines(h, `START: ${mediaType}:${type}#${id};`)

const endComment = (h: XhtmlBuilder, { mediaType, type, id }: IframeArgs) =>
  commentLines(h, `END: ${mediaType}:${type}#${id};`)

// The embed's thumbnail, linking to its page in the list of illustrations
export function createIframe(
  { id, href, poster }: Pick<IframeArgs, 'id' | 'href' | 'poster'>,
  h: XhtmlBuilder
): XhtmlNode {
  return h.fragment([
    nl(4),
    h('div', { class: 'figure__small figure__small--landscape' }, [
      nl(6),
      h('figure', { id: `ref${id}` }, [
        nl(8),
        h('a', { href: `${href}#${id}` }, [
          nl(10),
          posterImage(h, poster),
          nl(8),
        ]),
        nl(6),
      ]),
      nl(4),
    ]),
  ])
}

// The embed, where the target has live embeds
export function createIframeInline(
  data: IframeArgs,
  h: XhtmlBuilder
): XhtmlNode {
  const {
    id,
    commentStart,
    commentEnd,
    mediaType,
    attrString,
    source,
    caption,
    ...rest
  } = data

  // TODO(TASK-056): 'frameborder' is not a valid EPUB 3 attribute and causes
  // EPUBCheck errors. Remove once the iframe template is EPUB 3 compliant.
  // const defaults = { allow: 'fullscreen autoplay', frameborder: '0' }
  const defaults = { allow: 'fullscreen autoplay' }
  const iframeAttrs = Object.entries({ ...defaults, ...rest }).flatMap(
    ([key, val]): [string, string][] =>
      !htmlIframeAttributes.has(key) || val === '' ? [] : [[key, String(val)]]
  )

  return h.fragment([
    nl(4),
    startComment(h, data),
    nl(6),
    h('section', { class: `${mediaType} figure__large figure__inline` }, [
      nl(8),
      h(
        'div',
        [['id', id], ...attributesList({ classes: rest.classes })],
        [
          nl(10),
          h('iframe', [['src', source], ...iframeAttrs], [nl(10)]),
          nl(8),
        ]
      ),
      nl(8),
      caption
        ? h('p', { class: `caption caption__${mediaType}` }, [h.raw(caption)])
        : null,
      nl(6),
    ]),
    nl(4),
    endComment(h, data),
  ])
}

// Where the target has no live embeds: the poster and a message. The figure
// in the list of illustrations says so too, from b-ber-templates
export function createUnsupportedInline(
  data: IframeArgs,
  h: XhtmlBuilder
): XhtmlNode {
  const { id, mediaType, poster } = data
  const fallback = `media__fallback media__fallback__${mediaType}`
  return h.fragment([
    nl(4),
    startComment(h, data),
    nl(4),
    h('section', { class: `${mediaType} figure__large figure__inline` }, [
      nl(6),
      h(
        'div',
        [['id', id], ...attributesList({ classes: data.classes })],
        [
          nl(8),
          h('div', { class: `${fallback} media__fallback--image` }, [
            nl(10),
            h('figure', null, [nl(12), posterImage(h, poster), nl(10)]),
            nl(8),
          ]),
          nl(8),
          h('p', { class: `${fallback} media__fallback--text` }, [
            'Your device does not support embedded media.',
          ]),
          nl(6),
        ]
      ),
      nl(4),
    ]),
    nl(4),
    endComment(h, data),
  ])
}
