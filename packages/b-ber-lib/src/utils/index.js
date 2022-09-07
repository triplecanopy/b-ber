import fs from 'fs-extra'
import path from 'path'
import find from 'lodash/find'
import uniq from 'lodash/uniq'
import log from '@canopycanopycanopy/b-ber-logger'
import findIndex from 'lodash/findIndex'
// import ffprobe from 'ffprobe'
// import ffprobeStatic from 'ffprobe-static'
import mime from 'mime-types'
import { Url, State as state } from '..'

// Get a file's relative path to the OPS
export const opsPath = (fpath, base) =>
  fpath.replace(new RegExp(`^${base}${path.sep}OPS${path.sep}?`), '')

// https://www.w3.org/TR/xml-names/#Conformance
export const fileId = str => `_${str.replace(/[^a-zA-Z0-9_-]/g, '_')}`

// Determine an image's orientation
export const getImageOrientation = (w, h) => {
  // assign image class based on w:h ratio
  const widthToHeight = w / h
  let imageType = null

  if (widthToHeight < 0.61) imageType = 'portrait-high'
  if (widthToHeight >= 0.61 && widthToHeight < 1) imageType = 'portrait'
  if (widthToHeight === 1) imageType = 'square'
  if (widthToHeight > 1) imageType = 'landscape'
  return imageType
}

// const getAspectRatioClassName = (key = '16:9') =>
//     ({ '4:3': 'video--4x3', '16:9': 'video--16x9', '21:9': 'video--21x9' }[key])

// export const getVideoAspectRatio = async filePath => {
//     if (!filePath) return getAspectRatioClassName()

//     const { streams } = await ffprobe(filePath, { path: ffprobeStatic.path })
//     if (!streams) return getAspectRatioClassName()
//     const { display_aspect_ratio: aspectRatio } = streams
//     return getAspectRatioClassName(aspectRatio)
// }

// Create an iterator from object's key/value pairs
export const forOf = (collection, iterator) =>
  Object.entries(collection).forEach(([key, val]) => iterator(key, val))

// TODO: the whole figures/generated pages/user-configurable YAML thing should
// be worked out better. one reason is below, where we need the title of a
// generated page, but since metadata is attached in the frontmatter YAML of an
// MD file, there is no reference for the metadata.
// @issue: https://github.com/triplecanopy/b-ber/issues/208
//
// this is provisional, will just cause more confusion in the future
export const getTitle = page => {
  if (page.name === 'figures-titlepage') return 'Figures'
  const meta = state.spine.frontMatter.get(page.name)
  return meta && meta.title ? meta.title : page.title || page.name
}

export const getBookMetadata = term => {
  const entry = find(state.metadata.json(), { term })
  if (entry && entry.value) return entry.value
  log.warn(`Could not find metadata value for ${term}`)
  return ''
}

export const safeWrite = (dest, data) =>
  fs.existsSync(dest) ? Promise.resolve() : fs.writeFile(dest, data)

export const fail = (_msg, _err, yargs) => {
  yargs.showHelp()
  process.exit(0)
}

const ensureDirs = (dirs, prefix) => {
  const cwd = process.cwd()
  const dirs_ = uniq(
    [
      `${prefix}/_project`,
      `${prefix}/_project/_fonts`,
      `${prefix}/_project/_images`,
      `${prefix}/_project/_javascripts`,
      `${prefix}/_project/_markdown`,
      `${prefix}/_project/_media`,
      `${prefix}/_project/_stylesheets`,
      `${prefix}/themes`,
    ].concat(dirs)
  ).map(a => fs.ensureDir(path.join(cwd, a)))

  return Promise.all(dirs_)
}

const ensureFiles = (files, prefix) => {
  const files_ = [
    {
      absolutePath: path.resolve(prefix, '_project', 'toc.yml'),
      content: '',
    },
  ]
    .filter(({ absolutePath }) => findIndex(files, { absolutePath }) < 0)
    .concat(files)
    .reduce(
      (acc, curr) =>
        fs.existsSync(curr.absolutePath)
          ? acc
          : acc.concat(fs.writeFile(curr.absolutePath, curr.content)),
      []
    )
  return Promise.all(files_)
}

// make sure all necessary files and directories exist
export const ensure = ({ files = [], dirs = [], prefix = '' } = {}) =>
  ensureDirs(dirs, prefix)
    .then(() => ensureFiles(files, prefix))
    .catch(log.error)

const trimLeadingSlash = s => s.replace(/^\//, '')

export const resolveIntersectingUrl = (u, p) => {
  let url

  try {
    url = new URL(u)
  } catch (err) {
    log.warn(`${err.message}: "${u}"`)
    return u
  }

  const { pathname } = url

  let urlParts = pathname.split('/').filter(Boolean)
  let pathParts = p.split('/').filter(Boolean)

  // Remove filename if there is one
  if (/\./.test(urlParts[urlParts.length - 1])) {
    urlParts.pop()
  }

  // Find indices where to slice arrays
  let intersectionIndices = []
  for (let i = 0; i < urlParts.length; i++) {
    for (let j = 0; j < pathParts.length; j++) {
      if (urlParts[i] === pathParts[j]) {
        intersectionIndices = [i, j]
        break
      }
    }
  }

  const [uIdx, pIdx] = intersectionIndices

  urlParts = urlParts.slice(0, uIdx)
  pathParts = pathParts.slice(pIdx)

  const intersection = urlParts.concat(pathParts)

  url.pathname = intersection.join('/')

  return url.href
}

const webpubManifestResource = base => file => {
  const href = resolveIntersectingUrl(base, file)

  return {
    href,
    type: mime.lookup(file),
  }
}

const webpubManifestReadingOrderItem = base => ({ title, file }) => {
  const href = resolveIntersectingUrl(base, file)

  return {
    href,
    title,
    type: 'text/xhtml',
  }
}

// https://github.com/readium/webpub-manifest
export const generateWebpubManifest = files => {
  const remoteURL = Url.trimSlashes(state.config.remote_url)

  // Build a map to sort the files according to the position in the spine
  const fileMap = new Map(files.map(f => [path.basename(f), f]))

  // Create the items for the manifest's reading order
  const readingOrderItems = state.spine.flattened.reduce((acc, curr) => {
    const file = fileMap.get(`${curr.fileName}.xhtml`)

    return !file ? acc : acc.concat({ file, title: curr.title })
  }, [])

  const readingOrder = readingOrderItems.map(
    webpubManifestReadingOrderItem(remoteURL)
  )

  const resources = files
    .filter(file => path.basename(file).charAt(0) !== '.')
    .map(webpubManifestResource(remoteURL))

  const manifest = {
    '@context': 'https://readium.org/webpub-manifest/context.jsonld',

    metadata: {
      '@type': 'http://schema.org/Book',
      title: getBookMetadata('title', state),
      author: getBookMetadata('creator', state),
      identifier: getBookMetadata('identifier', state),
      language: getBookMetadata('language', state),
      publisher: getBookMetadata('publisher', state),
      modified: new Date().toISOString(),
    },

    links: [
      {
        rel: 'self',
        href: `${remoteURL}/${trimLeadingSlash(state.distDir)}/manifest.json`,
        type: 'application/webpub+json',
      },
      // { rel: 'alternate', href: `${remoteURL}/publication.epub`, type: 'application/epub+zip' },
      // { rel: 'search', href: `${remoteURL}/search{?query}`, type: 'text/html', templated: true },
    ],

    readingOrder,
    resources,
  }

  return manifest
}

// b-ber-grammar-* utilities
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
  caption
    ? `<p class="bber-caption bber-caption__${mediaType}">${caption}</p>`
    : ''

export const getMediaType = type => {
  const index = type.indexOf('-')
  return index > -1 ? type.substring(0, index) : type
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

export function ensureSource(obj, type, fileName, lineNumber) {
  if (!obj.source) {
    log.error(
      `Directive [${type}] requires a [source] attribute at [${fileName}:${lineNumber}]`
    )
  }
}

export function ensurePoster(obj, type) {
  if (!obj.poster) return

  validatePosterImage(obj.poster, type)
  // eslint-disable-next-line no-param-reassign
  obj.poster = `../images/${encodeURIComponent(path.basename(obj.poster))}`
}

// Add mediaType to classes
export function ensureSupportedClassNames(obj, supported) {
  // eslint-disable-next-line no-param-reassign
  obj.classes += ` embed ${supported(state.build) ? '' : 'un'}supported`
}
