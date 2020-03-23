import fs from 'fs-extra'
import path from 'path'
import mime from 'mime-types'
import { Url } from '@canopycanopycanopy/b-ber-lib'
import log from '@canopycanopycanopy/b-ber-logger'
import state from '@canopycanopycanopy/b-ber-lib/State'
import { toAlias } from '@canopycanopycanopy/b-ber-grammar-attributes'
// import { getVideoAspectRatio } from '@canopycanopycanopy/b-ber-lib/utils'

export const getMediaType = type => {
  const index = type.indexOf('-')
  return index > -1 ? type.substring(0, index) : type
}

export const isHostedRemotely = asset => /^http/.test(asset)

export const isHostedBySupportedThirdParty = asset =>
  asset.match(/(vimeo|youtube)\.com/)

export const validatePosterImage = (_asset, type) => {
  const asset = state.src.images(_asset)
  const isInlineMedia = /inline/.test(type)

  if (!fs.existsSync(asset)) {
    if (isInlineMedia) {
      log.error(
        'bber-directives: inline media directives requires a [poster] attribute, aborting'
      )
    } else {
      log.error(`bber-directives: Poster image for [${type}] does not exist`)
    }
  }

  return asset
}

export const validateLocalMediaSource = (asset, mediaType) => {
  const media = [...state[mediaType]].map(file => toAlias(file))
  if (!asset.length || media.indexOf(asset) < 0) {
    log.error(
      `Could not find [${mediaType}] matching [${asset}], make sure it's included in the [_media] directory`
    )
  }

  return asset
}

export const createLocalMediaSources = sources =>
  sources.reduce(
    (acc, curr) =>
      acc.concat(
        `<source src="../media/${path.basename(curr)}" type="${mime.lookup(
          curr
        )}"/>`
      ),
    ''
  )

export const createRemoteMediaSource = sources =>
  `<source src="${sources[0]}" type="${mime.lookup(sources[0])}"/>`

export function getWebOnlyAttributesString() {
  return state.build === 'web' || state.build === 'reader'
    ? ' webkit-playsinline="webkit-playsinline" playsinline="playsinline"'
    : ''
}

export function createMedia({ id, href, poster }) {
  return `
    <div class="figure__small figure__small--landscape">
      <figure id="ref${id}">
        <a href="${href}#${id}">
          <img src="${poster}" alt=""/>
        </a>
      </figure>
    </div>`
}

export function createIFrame({
  commentStart,
  commentEnd,
  id,
  source,
  caption,
  mediaType,
}) {
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
}) {
  return `
    ${commentStart}
      <section class="${mediaType} ${aspectRatioClassName} figure__large figure__inline">
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
