import { State as state } from '@canopycanopycanopy/b-ber-lib'
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
      log.error(message)
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

export const validatePosterImage = (asset: string, type: string): string => {
  const assetPath = state.src.images(asset)

  if (!fs.existsSync(assetPath)) {
    log.error(`bber-directives: Poster image for [${type}] does not exist`)
  }

  return asset
}

export const renderPosterImage = (poster: string): string =>
  poster ? `<img src="${poster}" alt="Poster Image"/>` : ''

export const renderCaption = (caption: string, mediaType: string): string =>
  caption ? `<p class="caption caption__${mediaType}">${caption}</p>` : ''

export const getMediaType = (type: string): string => {
  const index = type.indexOf('-')
  return index > -1 ? type.substring(0, index) : type
}

export interface VimeoFigureArgs {
  id: string
  href: string
  poster: string
}

export function createVimeo({ id, href, poster }: VimeoFigureArgs): string {
  return `
    <div class="figure__small figure__small--landscape">
      <figure id="ref${id}">
        <a href="${href}#${id}">
          ${renderPosterImage(poster)}
        </a>
      </figure>
    </div>`
}

export interface VimeoInlineArgs {
  id: string
  commentStart: string
  commentEnd: string
  mediaType: string
  attrString: string
  attrQuery: string
  aspectRatio: string
  aspectRatioClassName: string
  source: string
  poster: string
  caption: string
}

export function createVimeoInline({
  id,
  commentStart,
  commentEnd,
  mediaType,
  attrString,
  attrQuery,
  aspectRatio,
  aspectRatioClassName,
  source,
  poster,
  caption,
}: VimeoInlineArgs): string {
  return `
    ${commentStart}
      <section class="${mediaType} ${aspectRatioClassName} figure__large figure__inline">
        <div id="${id}"${attrString}>
          ${state.build !== 'reader' ? renderPosterImage(poster) : ''}
          <iframe
            data-vimeo="true"
            data-vimeo-poster="${poster}"
            data-aspect-ratio="${aspectRatio}"
            src="https://player.vimeo.com/video/${source}${attrQuery}"
            webkitallowfullscreen="webkitallowfullscreen"
            mozallowfullscreen="mozallowfullscreen"
            allowfullscreen="allowfullscreen"
            frameborder="0">
          </iframe>
        </div>
        ${renderCaption(caption, mediaType)}
      </section>
    ${commentEnd}`
}

export interface UnsupportedInlineArgs {
  id: string
  commentStart: string
  commentEnd: string
  attrString: string
  mediaType: string
  poster: string
}

// Only render unsupported HTML for inline embeds since the unsupported figure
// in the LOI is handled by b-ber-templates. Not great UI to have to click to
// the LOI to see that something is unsupported, but vimeo directives should
// mostly be managed by media.yml which supports fallbacks.
export function createUnsupportedInline({
  id,
  commentStart,
  commentEnd,
  attrString,
  mediaType,
  poster,
}: UnsupportedInlineArgs): string {
  return `
    ${commentStart}
      <section class="${mediaType} figure__large figure__inline">
        <div id="${id}" ${attrString}>
          <div class="media__fallback media__fallback__${mediaType} media__fallback--image">
            <figure>
              ${renderPosterImage(poster)}
            </figure>
          </div>
          <p class="media__fallback media__fallback__${mediaType} media__fallback--text">Your device does not support embedded media.</p>
        </div>
      </section>
    ${commentEnd}`
}
