import fs from 'fs-extra'
import log from '@canopycanopycanopy/b-ber-logger'
import state from '@canopycanopycanopy/b-ber-lib/State'
import isUndefined from 'lodash.isundefined'

// `bBerAttributes` and the `soundcloudAttributesTransformer` below are used to
// filter when building the query string for Soundcloud embeds, and for
// filtering the soundcloud/soundcloud-inline's directive attributes that appear
// in the rendered HTML (such as class names).
export const bBerAttributes = {
  classes: true,
  aspectratio: true,
}

const ensureBoolean = val => val === 'yes'

const ensureMatch = (name, re) => val => {
  if (!re.test(val)) {
    log.error(`Invalid attribute. [${name}] must match [${re}]`)
  }

  return val
}

// TODO should split out validation elsewhere
export const soundcloudAttributesTransformer = {
  // Prepend # for color hex
  url: ensureMatch('url', /^http/),
  color: val =>
    `#${ensureMatch('color', /^(?:[a-fA-F0-9]{3}|[a-fA-F0-9]{6})$/)(val)}`,
  autoplay: ensureBoolean,
  buying: ensureBoolean,
  sharing: ensureBoolean,
  download: ensureBoolean,
  showartwork: ensureBoolean,
  showplaycount: ensureBoolean,
  showuser: ensureBoolean,
  starttrack: ensureMatch('starttrack', /^[0-9]+$/),
  singleactive: ensureBoolean,
}

export const transformAttributes = (obj, transformer) => {
  const nextObj = Object.entries(obj).reduce((acc, [key, val]) => {
    if (isUndefined(transformer[key])) return acc

    acc[key] = transformer[key](val)
    return acc
  }, {})

  return nextObj
}

export const validatePosterImage = (asset, type) => {
  const assetPath = state.src.images(asset)

  if (!fs.existsSync(assetPath)) {
    log.error(`bber-directives: Poster image for [${type}] does not exist`)
  }

  return asset
}

export const renderPosterImage = poster =>
  poster ? `<img src="${poster}" alt="Poster Image"/>` : ''

export const renderCaption = (caption, mediaType) =>
  caption ? `<p class="caption caption__${mediaType}">${caption}</p>` : ''

export const getMediaType = type => {
  const index = type.indexOf('-')
  return index > -1 ? type.substring(0, index) : type
}

export function createSoundcloud({ id, href, poster }) {
  return `
    <div class="figure__small figure__small--landscape">
      <figure id="ref${id}">
        <a href="${href}#${id}">
          ${renderPosterImage(poster)}
        </a>
      </figure>
    </div>`
}

export function createSoundcloudInline({
  id,
  commentStart,
  commentEnd,
  mediaType,
  attrString,
  attrQuery,
  poster,
  caption,
}) {
  return `
    ${commentStart}
      <section class="${mediaType} figure__large figure__inline">
        <div id="${id}"${attrString}>
          <iframe
            data-soundcloud="true"
            data-soundcloud-poster="${poster}"
            src="https://w.soundcloud.com/player/${attrQuery}"
            webkitallowfullscreen="webkitallowfullscreen"
            mozallowfullscreen="mozallowfullscreen"
            allowfullscreen="allowfullscreen"
            allow="autoplay"
            frameborder="0"
            scrolling="no"
          >
          </iframe>
        </div>
        ${renderCaption(caption, mediaType)}
      </section>
    ${commentEnd}`
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
}) {
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
