import path from 'node:path'
import {
  commentLines,
  toAlias,
} from '@canopycanopycanopy/b-ber-grammar-attributes'
import {
  type DocumentEnv,
  Html,
  Url,
  type XhtmlBuilder,
  type XhtmlNode,
} from '@canopycanopycanopy/b-ber-lib'
import log from '@canopycanopycanopy/b-ber-logger'
import fs from 'fs-extra'
import mime from 'mime-types'
// import { getVideoAspectRatio } from '@canopycanopycanopy/b-ber-lib/utils'

// The project's media files the document input lists, which DIRECTIVE_RE
// limits `mediaType` to
export type MediaType = 'audio' | 'video'

export const getMediaType = (type: string): string => {
  const index = type.indexOf('-')
  return index > -1 ? type.substring(0, index) : type
}

export const isHostedRemotely = (asset: string): boolean => /^http/.test(asset)

export const isHostedBySupportedThirdParty = (
  asset: string
): RegExpMatchArray | null => asset.match(/(vimeo|youtube)\.com/)

export const validatePosterImage = (
  _asset: string,
  type: string,
  env: DocumentEnv
): string => {
  const asset = env.document.images(_asset)

  if (!fs.existsSync(asset)) {
    throw log.error(
      `bber-directives: Poster image for [${type}] does not exist`
    )
  }

  return asset
}

export const validateLocalMediaSource = (
  asset: string,
  mediaType: MediaType,
  env: DocumentEnv
): string => {
  const media = [...env.document[mediaType]].map((file) => toAlias(file))
  if (!asset.length || media.indexOf(asset) < 0) {
    throw log.error(
      `Could not find [${mediaType}] matching [${asset}], make sure it's included in the [_media] directory`
    )
  }

  return asset
}

export const createLocalMediaSources = (sources: string[]): string =>
  sources.reduce(
    (acc, curr) =>
      acc.concat(
        `<source src="${Html.escape(`../media/${path.basename(curr)}`)}" type="${mime.lookup(
          curr
        )}"/>`
      ),
    ''
  )

export const createRemoteMediaSource = (sources: string[]): string =>
  `<source src="${Html.escape(sources[0])}" type="${mime.lookup(sources[0])}"/>`

// The media element's `<source>`s, as `[src, type]`, unescaped
export const localMediaSources = (sources: string[]): [string, string][] =>
  sources.map((curr) => [
    `../media/${path.basename(curr)}`,
    String(mime.lookup(curr)),
  ])

export const remoteMediaSource = (sources: string[]): [string, string][] => [
  [sources[0], String(mime.lookup(sources[0]))],
]

export function getWebOnlyAttributesString(env: DocumentEnv): string {
  return env.document.target.features.liveEmbeds
    ? ' webkit-playsinline="webkit-playsinline" playsinline="playsinline"'
    : ''
}

// The attributes `getWebOnlyAttributesString` writes
export const webOnlyAttributes = (env: DocumentEnv): [string, string][] =>
  env.document.target.features.liveEmbeds
    ? [
        ['webkit-playsinline', 'webkit-playsinline'],
        ['playsinline', 'playsinline'],
      ]
    : []

// A line break and the indentation the markup was written with
const nl = (indent: number): string => `\n${' '.repeat(indent)}`

interface Commented {
  mediaType: string
  type: string
  id: string
}

const startComment = (h: XhtmlBuilder, { mediaType, type, id }: Commented) =>
  commentLines(h, `START: ${mediaType}:${type}#${id};`)

const endComment = (h: XhtmlBuilder, { mediaType, type, id }: Commented) =>
  commentLines(h, `END: ${mediaType}:${type}#${id};`)

const captionOf = (
  h: XhtmlBuilder,
  caption: string,
  mediaType: string
): XhtmlNode | null =>
  caption
    ? h('p', { class: `caption caption__${mediaType}` }, [h.raw(caption)])
    : null

export interface MediaFigureArgs {
  id: string
  href: string
  poster: string
}

// The media's thumbnail, linking to its page in the list of illustrations
export function createMedia(
  { id, href, poster }: MediaFigureArgs,
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
          h('img', { src: poster, alt: '' }),
          nl(8),
        ]),
        nl(6),
      ]),
      nl(4),
    ]),
  ])
}

export interface IFrameArgs extends Commented {
  source: string
  caption: string
}

// A video a supported third party hosts, embedded
export function createIFrame(data: IFrameArgs, h: XhtmlBuilder): XhtmlNode {
  const { id, source, caption, mediaType } = data
  return h.fragment([
    nl(4),
    startComment(h, data),
    nl(6),
    h('section', { id }, [
      nl(8),
      h('iframe', { src: Url.encodeQueryString(source) }),
      nl(10),
      captionOf(h, caption, mediaType),
      nl(6),
    ]),
    nl(4),
    endComment(h, data),
  ])
}

// What the inline media element is built with besides the figure's data
export interface MediaElement {
  attributes: [string, string][]
  sources: [string, string][]
}

export interface MediaInlineArgs extends Commented {
  aspectRatioClassName: string
  poster: string
  caption: string
  controls: string
}

// The audio or video element, with its sources and fallbacks
export function createMediaInline(
  data: MediaInlineArgs,
  { attributes, sources }: MediaElement,
  h: XhtmlBuilder
): XhtmlNode {
  const { id, mediaType, aspectRatioClassName, poster, caption, controls } =
    data
  const fallback = `media__fallback media__fallback__${mediaType}`
  return h.fragment([
    nl(4),
    startComment(h, data),
    nl(6),
    h(
      'section',
      {
        class: `${mediaType} ${aspectRatioClassName} figure__large figure__large__controls--${controls} figure__inline`,
      },
      [
        nl(8),
        h(
          mediaType,
          [['id', id], ...attributes],
          [
            nl(10),
            ...sources.map(([src, type]) => h('source', { src, type })),
            nl(10),
            poster
              ? h('div', { class: `${fallback} media__fallback--image` }, [
                  nl(18),
                  h('figure', null, [
                    nl(20),
                    h('img', { src: poster, alt: 'Media fallback image' }),
                    nl(18),
                  ]),
                  nl(16),
                ])
              : null,
            nl(10),
            h('p', { class: `${fallback} media__fallback--text` }, [
              `Your device does not support the HTML5 ${mediaType} API.`,
            ]),
            nl(8),
          ]
        ),
        nl(8),
        captionOf(h, caption, mediaType),
        nl(6),
      ]
    ),
    nl(4),
    endComment(h, data),
  ])
}
