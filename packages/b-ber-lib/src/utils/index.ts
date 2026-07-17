import log from '@canopycanopycanopy/b-ber-logger'
import fs from 'fs-extra'
import find from 'lodash/find'
import findIndex from 'lodash/findIndex'
import uniq from 'lodash/uniq'
import mime from 'mime-types'
import path from 'path'
import state from '../State'
import Url from '../Url'

interface EnsureOptions {
  files?: Array<{ absolutePath: string; content: string }>
  dirs?: string[]
  prefix?: string
}

interface UnsupportedInlineOptions {
  id: string
  commentStart: string
  commentEnd: string
  attrString: string
  mediaType: string
  poster: string
}

// Get a file's relative path to the OPS
export const opsPath = (fpath: string, base: string): string =>
  fpath.replace(new RegExp(`^${base}${path.sep}OPS${path.sep}?`), '')

// https://www.w3.org/TR/xml-names/#Conformance
export const fileId = (str: string): string =>
  `_${str.replace(/[^a-zA-Z0-9_-]/g, '_')}`

// Determine an image's orientation
export const getImageOrientation = (w: number, h: number): string | null => {
  // assign image class based on w:h ratio
  const widthToHeight = w / h
  let imageType: string | null = null

  if (widthToHeight < 0.61) imageType = 'portrait-high'
  if (widthToHeight >= 0.61 && widthToHeight < 1) imageType = 'portrait'
  if (widthToHeight === 1) imageType = 'square'
  if (widthToHeight > 1) imageType = 'landscape'
  return imageType
}

// TODO: the whole figures/generated pages/user-configurable YAML thing should
// be worked out better. one reason is below, where we need the title of a
// generated page, but since metadata is attached in the frontmatter YAML of an
// MD file, there is no reference for the metadata.
// @issue: https://github.com/triplecanopy/b-ber/issues/208
//
// this is provisional, will just cause more confusion in the future
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const getTitle = (page: any): string => {
  if (page.name === 'figures-titlepage') return 'Figures'
  const meta = state.spine.frontMatter.get(page.name) as
    | Record<string, unknown>
    | undefined
  return meta && meta.title ? (meta.title as string) : page.title || page.name
}

export const getBookMetadata = (term: string): string => {
  const entry = find(state.metadata.json() as unknown[], { term }) as
    | Record<string, unknown>
    | undefined
  if (entry && entry.value) return entry.value as string
  log.warn(`Could not find metadata value for ${term}`)
  return ''
}

export const safeWrite = (dest: string, data: string): Promise<void> =>
  fs.existsSync(dest) ? Promise.resolve() : fs.writeFile(dest, data)

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const fail = (_msg: unknown, _err: unknown, yargs: any): void => {
  yargs.showHelp()
  process.exit(0)
}

const ensureDirs = (dirs: string[], prefix: string): Promise<unknown[]> => {
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
  ).map((a) => fs.ensureDir(path.join(cwd, a)))

  return Promise.all(dirs_)
}

const ensureFiles = (
  files: Array<{ absolutePath: string; content: string }>,
  prefix: string
): Promise<unknown[]> => {
  const files_ = [
    {
      absolutePath: path.resolve(prefix, '_project', 'toc.yml'),
      content: '',
    },
  ]
    .filter(({ absolutePath }) => findIndex(files, { absolutePath }) < 0)
    .concat(files)
    .reduce(
      (acc: Promise<void>[], curr) =>
        fs.existsSync(curr.absolutePath)
          ? acc
          : acc.concat(fs.writeFile(curr.absolutePath, curr.content)),
      []
    )
  return Promise.all(files_)
}

// make sure all necessary files and directories exist
export const ensure = ({
  files = [],
  dirs = [],
  prefix = '',
}: EnsureOptions = {}): Promise<unknown> =>
  ensureDirs(dirs, prefix)
    .then(() => ensureFiles(files, prefix))
    .catch(log.error)

const trimLeadingSlash = (s: string): string => s.replace(/^\//, '')

export const resolveIntersectingUrl = (u: string, p: string): string => {
  let url: URL

  try {
    url = new URL(u)
  } catch (err) {
    log.warn(`${(err as Error).message}: "${u}"`)
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
  let intersectionIndices: number[] = []
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

const webpubManifestResource =
  (base: string) =>
  (file: string): { href: string; type: string | false } => {
    const href = resolveIntersectingUrl(base, file)

    return {
      href,
      type: mime.lookup(file),
    }
  }

const webpubManifestReadingOrderItem =
  (base: string) =>
  ({
    title,
    file,
  }: {
    title: string
    file: string
  }): { href: string; title: string; type: string } => {
    const href = resolveIntersectingUrl(base, file)

    return {
      href,
      title,
      type: 'text/xhtml',
    }
  }

// https://github.com/readium/webpub-manifest
export const generateWebpubManifest = (
  files: string[]
): Record<string, unknown> => {
  const remoteURL = Url.trimSlashes(state.config.remote_url as string)

  // Build a map to sort the files according to the position in the spine
  const fileMap = new Map(files.map((f) => [path.basename(f), f]))

  // Create the items for the manifest's reading order
  const readingOrderItems = state.spine.flattened.reduce(
    (acc: Array<{ file: string; title: string }>, curr) => {
      const file = fileMap.get(
        `${(curr as { fileName: string }).fileName}.xhtml`
      )
      return !file
        ? acc
        : acc.concat({ file, title: (curr as { title: string }).title })
    },
    []
  )

  const readingOrder = readingOrderItems.map(
    webpubManifestReadingOrderItem(remoteURL)
  )

  const resources = files
    .filter((file) => path.basename(file).charAt(0) !== '.')
    .map(webpubManifestResource(remoteURL))

  const manifest = {
    '@context': 'https://readium.org/webpub-manifest/context.jsonld',

    metadata: {
      '@type': 'http://schema.org/Book',
      title: getBookMetadata('title'),
      author: getBookMetadata('creator'),
      identifier: getBookMetadata('identifier'),
      language: getBookMetadata('language'),
      publisher: getBookMetadata('publisher'),
      modified: new Date().toISOString(),
    },

    links: [
      {
        rel: 'self',
        href: `${remoteURL}/${trimLeadingSlash(state.distDir)}/manifest.json`,
        type: 'application/webpub+json',
      },
    ],

    readingOrder,
    resources,
  }

  return manifest
}

// b-ber-grammar-* utilities
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
}: UnsupportedInlineOptions): string {
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function ensureSource(
  obj: any,
  type: string,
  fileName: string,
  lineNumber: number
): void {
  if (!obj.source) {
    log.error(
      `Directive [${type}] requires a [source] attribute at [${fileName}:${lineNumber}]`
    )
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function ensurePoster(obj: any, type: string): void {
  if (!obj.poster) return

  validatePosterImage(obj.poster, type)
  // eslint-disable-next-line no-param-reassign
  obj.poster = `../images/${encodeURIComponent(path.basename(obj.poster))}`
}

// Add mediaType to classes
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function ensureSupportedClassNames(
  obj: any,
  supported: (build: string) => boolean
): void {
  // eslint-disable-next-line no-param-reassign
  obj.classes += ` embed ${supported(state.build) ? '' : 'un'}supported`
}
