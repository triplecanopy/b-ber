import { commentLines } from '@canopycanopycanopy/b-ber-grammar-attributes'
import type {
  DocumentEnv,
  XhtmlBuilder,
  XhtmlNode,
} from '@canopycanopycanopy/b-ber-lib'
import log from '@canopycanopycanopy/b-ber-logger'
import fs from 'fs-extra'
import isUndefined from 'lodash/isUndefined'

// `bBerAttributes` and the `vimeoAttributesTransformer` below are used to
// filter when building the query string for Vimeo embeds, and for filtering the
// vimeo/vimeo-inline's directive attributes that appear in the rendered HTML
// (such as class names).
export const bBerAttributes = {
  classes: true,
  aspectratio: true,
}

const ensureBoolean = (val: string): boolean => val === 'yes'

const ensureMatch =
  (name: string, re: RegExp) =>
  (val: string): string => {
    if (!re.test(val)) {
      let message = `Invalid Vimeo attribute. [${name}] must match [${re}]`
      message +=
        'See the Vimeo Player Parameters documentation for more information https://vimeo.zendesk.com/hc/en-us/articles/360001494447-Using-Player-Parameters'
      throw log.error(message)
    }

    return val
  }

export const vimeoAttributesTransformer = {
  autopause: ensureBoolean,
  autoplay: ensureBoolean,
  background: ensureBoolean,
  byline: ensureBoolean,
  color: ensureMatch('color', /^(?:[a-fA-F0-9]{3}|[a-fA-F0-9]{6})$/),
  controls: ensureBoolean,
  dnt: ensureBoolean,
  fun: ensureBoolean,
  loop: ensureBoolean,
  muted: ensureBoolean,
  playsinline: ensureBoolean,
  portrait: ensureBoolean,
  quality: ensureMatch('quality', /^(?:240p|360p|540p|720p|1080p|2k|4k)$/),
  speed: ensureBoolean,
  '#t': ensureMatch('#t', /^\d+[ms](?:\d+[s])?$/),
  texttrack: ensureMatch('texttrack', /^[a-zA-Z]{2}(?:[.-][a-zA-Z])?$/),
  title: ensureBoolean,
  transparent: ensureBoolean,
}

type AttributeTransformer = (val: string) => string | boolean

export const transformAttributes = (
  obj: Record<string, string>,
  transformer: Record<string, AttributeTransformer>
): Record<string, string | boolean> => {
  const nextObj = Object.entries(obj).reduce<Record<string, string | boolean>>(
    (acc, [key, val]) => {
      if (isUndefined(transformer[key])) return acc

      acc[key] = transformer[key](val)
      return acc
    },
    {}
  )

  return nextObj
}

export const validatePosterImage = (
  asset: string,
  type: string,
  env: DocumentEnv
): string => {
  const assetPath = env.document.images(asset)

  if (!fs.existsSync(assetPath)) {
    throw log.error(
      `bber-directives: Poster image for [${type}] does not exist`
    )
  }

  return asset
}

export const getMediaType = (type: string): string => {
  const index = type.indexOf('-')
  return index > -1 ? type.substring(0, index) : type
}

// A line break and the indentation the markup was written with
const nl = (indent: number): string => `\n${' '.repeat(indent)}`

const posterImage = (h: XhtmlBuilder, poster: string): XhtmlNode | null =>
  poster ? h('img', { src: poster, alt: 'Poster Image' }) : null

interface Commented {
  mediaType: string
  type: string
  id: string
}

const startComment = (h: XhtmlBuilder, { mediaType, type, id }: Commented) =>
  commentLines(h, `START: ${mediaType}:${type}#${id};`)

const endComment = (h: XhtmlBuilder, { mediaType, type, id }: Commented) =>
  commentLines(h, `END: ${mediaType}:${type}#${id};`)

// What an inline embed's elements are built with besides the figure's data:
// the container's attributes and the player's query string, unescaped
export interface VimeoElement {
  attributes: [string, string][]
  query: string
}

export interface VimeoFigureArgs {
  id: string
  href: string
  poster: string
}

// The video's thumbnail, linking to its page in the list of illustrations
export function createVimeo(
  { id, href, poster }: VimeoFigureArgs,
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

export interface VimeoInlineArgs extends Commented {
  aspectRatio: string
  aspectRatioClassName: string
  source: string
  poster: string
  caption: string
}

// The player, where the target has live embeds
export function createVimeoInline(
  data: VimeoInlineArgs,
  { attributes, query }: VimeoElement,
  env: DocumentEnv,
  h: XhtmlBuilder
): XhtmlNode {
  const { id, mediaType, aspectRatio, aspectRatioClassName, source, poster } =
    data
  return h.fragment([
    nl(4),
    startComment(h, data),
    nl(6),
    h(
      'section',
      {
        class: `${mediaType} ${aspectRatioClassName} figure__large figure__inline`,
      },
      [
        nl(8),
        h(
          'div',
          [['id', id], ...attributes],
          [
            nl(10),
            env.document.target.features.readerRuntime
              ? null
              : posterImage(h, poster),
            nl(10),
            h(
              'iframe',
              {
                'data-vimeo': 'true',
                'data-vimeo-poster': poster,
                'data-aspect-ratio': aspectRatio,
                src: `https://player.vimeo.com/video/${source}${query}`,
                webkitallowfullscreen: 'webkitallowfullscreen',
                mozallowfullscreen: 'mozallowfullscreen',
                allowfullscreen: 'allowfullscreen',
                frameborder: '0',
              },
              [nl(10)]
            ),
            nl(8),
          ]
        ),
        nl(8),
        data.caption
          ? h('p', { class: `caption caption__${mediaType}` }, [
              h.raw(data.caption),
            ])
          : null,
        nl(6),
      ]
    ),
    nl(4),
    endComment(h, data),
  ])
}

export interface UnsupportedInlineArgs extends Commented {
  poster: string
}

// Only render unsupported HTML for inline embeds since the unsupported figure
// in the LOI is handled by b-ber-templates. Not great UI to have to click to
// the LOI to see that something is unsupported, but vimeo directives should
// mostly be managed by media.yml which supports fallbacks.
export function createUnsupportedInline(
  data: UnsupportedInlineArgs,
  { attributes }: Pick<VimeoElement, 'attributes'>,
  h: XhtmlBuilder
): XhtmlNode {
  const { id, mediaType, poster } = data
  const fallback = `media__fallback media__fallback__${mediaType}`
  return h.fragment([
    nl(4),
    startComment(h, data),
    nl(6),
    h('section', { class: `${mediaType} figure__large figure__inline` }, [
      nl(8),
      h(
        'div',
        [['id', id], ...attributes],
        [
          nl(10),
          h('div', { class: `${fallback} media__fallback--image` }, [
            nl(12),
            h('figure', null, [nl(14), posterImage(h, poster), nl(12)]),
            nl(10),
          ]),
          nl(10),
          h('p', { class: `${fallback} media__fallback--text` }, [
            'Your device does not support embedded media.',
          ]),
          nl(8),
        ]
      ),
      nl(6),
    ]),
    nl(4),
    endComment(h, data),
  ])
}
