import { toAlias } from '@canopycanopycanopy/b-ber-grammar-attributes'
import { State as state, Url } from '@canopycanopycanopy/b-ber-lib'
import log from '@canopycanopycanopy/b-ber-logger'
import fs from 'fs-extra'
import mime from 'mime-types'
import path from 'path'
// import { getVideoAspectRatio } from '@canopycanopycanopy/b-ber-lib/utils'

// The media collections on `State`, which DIRECTIVE_RE limits `mediaType` to
export type MediaType = 'audio' | 'video'

export const getMediaType = (type: string): string => {
  const index = type.indexOf('-')
  return index > -1 ? type.substring(0, index) : type
}

export const isHostedRemotely = (asset: string): boolean => /^http/.test(asset)

export const isHostedBySupportedThirdParty = (
  asset: string
): RegExpMatchArray | null => asset.match(/(vimeo|youtube)\.com/)

export const validatePosterImage = (_asset: string, type: string): string => {
  const asset = state.src.images(_asset)

  if (!fs.existsSync(asset)) {
    log.error(`bber-directives: Poster image for [${type}] does not exist`)
  }

  return asset
}

export const validateLocalMediaSource = (
  asset: string,
  mediaType: MediaType
): string => {
  const media = [...state[mediaType]].map((file) => toAlias(file))
  if (!asset.length || media.indexOf(asset) < 0) {
    log.error(
      `Could not find [${mediaType}] matching [${asset}], make sure it's included in the [_media] directory`
    )
  }

  return asset
}

export const createLocalMediaSources = (sources: string[]): string =>
  sources.reduce(
    (acc, curr) =>
      acc.concat(
        `<source src="../media/${path.basename(curr)}" type="${mime.lookup(
          curr
        )}"/>`
      ),
    ''
  )

export const createRemoteMediaSource = (sources: string[]): string =>
  `<source src="${sources[0]}" type="${mime.lookup(sources[0])}"/>`

export function getWebOnlyAttributesString(): string {
  return state.build === 'web' || state.build === 'reader'
    ? ' webkit-playsinline="webkit-playsinline" playsinline="playsinline"'
    : ''
}

export interface MediaFigureArgs {
  id: string
  href: string
  poster: string
}

export function createMedia({ id, href, poster }: MediaFigureArgs): string {
  return `
    <div class="figure__small figure__small--landscape">
      <figure id="ref${id}">
        <a href="${href}#${id}">
          <img src="${poster}" alt=""/>
        </a>
      </figure>
    </div>`
}

export interface IFrameArgs {
  commentStart: string
  commentEnd: string
  id: string
  source: string
  caption: string
  mediaType: string
}

export function createIFrame({
  commentStart,
  commentEnd,
  id,
  source,
  caption,
  mediaType,
}: IFrameArgs): string {
  return `
    ${commentStart}
      <section id="${id}">
        <iframe src="${Url.encodeQueryString(source)}" />
          ${
            caption
              ? `<p class="caption caption__${mediaType}">${caption}</p>`
              : ''
          }
      </section>
    ${commentEnd}`
}

export interface MediaInlineArgs {
  commentStart: string
  commentEnd: string
  mediaType: string
  aspectRatioClassName: string
  id: string
  attrString: string
  webOnlyAttrString: string
  sourceElements: string
  poster: string
  caption: string
  controls: string
}

export function createMediaInline({
  commentStart,
  commentEnd,
  mediaType,
  aspectRatioClassName,
  id,
  attrString,
  webOnlyAttrString,
  sourceElements,
  poster,
  caption,
  controls,
}: MediaInlineArgs): string {
  return `
    ${commentStart}
      <section class="${mediaType} ${aspectRatioClassName} figure__large figure__large__controls--${controls} figure__inline">
        <${mediaType} id="${id}"${attrString}${webOnlyAttrString}>
          ${sourceElements}
          ${
            poster
              ? `<div class="media__fallback media__fallback__${mediaType} media__fallback--image">
                  <figure>
                    <img src="${poster}" alt="Media fallback image"/>
                  </figure>
                </div>`
              : ''
          }
          <p class="media__fallback media__fallback__${mediaType} media__fallback--text">Your device does not support the HTML5 ${mediaType} API.</p>
        </${mediaType}>
        ${
          caption
            ? `<p class="caption caption__${mediaType}">${caption}</p>`
            : ''
        }
      </section>
    ${commentEnd}`
}
