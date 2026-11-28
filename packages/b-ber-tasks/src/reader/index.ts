/* eslint-disable camelcase */

import crypto from 'node:crypto'
import path from 'node:path'
import {
  type BuildContext,
  type ConfigOptions,
  type MetadataEntry,
  Url,
} from '@canopycanopycanopy/b-ber-lib'
import { generateWebpubManifest } from '@canopycanopycanopy/b-ber-lib/utils'
import log from '@canopycanopycanopy/b-ber-logger'
import fs from 'fs-extra'
import find from 'lodash/find'
import has from 'lodash/has'
import rrdir from 'recursive-readdir'
import { dist } from '../context'

const OUTPUT_DIR_NAME = 'epub'
const EPUB_ASSETS = ['META-INF', 'OPS', 'mimetype']
const READER_MODULE_NAME = '@canopycanopycanopy/b-ber-reader'
const READER_MODULE_DIST_DIR = 'dist'

// Where one reader build writes, and where it found the reader app
interface ReaderPaths {
  outputDir: string
  apiDir: string
  readerAppPath: string | null
}

const remoteURL = (ctx: BuildContext) => {
  const { config } = ctx
  if (
    process.env.NODE_ENV === 'production' &&
    (!config || !config.remote_url || /^http/.test(config.remote_url) === false)
  ) {
    throw new Error(
      'Task [build/reader] requires a remote_url to be set in config.yml'
    )
  }
  return config.remote_url || 'http://localhost:4000/'
}

const createDirname = (s: string) => {
  if (!s || typeof s !== 'string') {
    return crypto.randomBytes(20).toString('hex')
  }
  return s.replace(/[^0-9a-zA-Z-]/g, '-')
}

// All of metadata.yml, or the value of one term
function getBookMetadata(ctx: BuildContext): MetadataEntry[]
function getBookMetadata(ctx: BuildContext, term: string): string
function getBookMetadata(
  ctx: BuildContext,
  term?: string
): MetadataEntry[] | string {
  const metadata = ctx.project.metadata.json()
  if (!term) return metadata

  const entry = find(metadata, { term })
  if (entry && entry.value) return entry.value

  log.warn(`Could not find metadata value for ${term}`)

  return ''
}

const getProjectConfig = (ctx: BuildContext, term?: string) => {
  if (!term) return ctx.config

  if (!has(ctx.config, term)) {
    log.warn(`Invalid property for config: ${term}`)
  }

  return ctx.config[term]
}

// Where the reader app is: the installed module, or a symlinked one
const findReaderApp = (): string => {
  try {
    return path.join(
      path.dirname(path.join(require.resolve(READER_MODULE_NAME))),
      READER_MODULE_DIST_DIR
    )
  } catch (err) {
    // module not found using require.resolve, so we check if there's a symlinked version available
    log.warn(`Could not find globally installed module ${READER_MODULE_NAME}`)
  }

  const { paths } = module
  let modulePath: string | undefined
  for (let i = 0; i < paths.length; i++) {
    const _path = path.resolve(paths[i], READER_MODULE_NAME)
    if (fs.existsSync(_path)) {
      modulePath = _path
      break
    }
  }

  if (!modulePath) {
    throw log.error(
      `Cannot find module ${READER_MODULE_NAME}. Try running npm i -S ${READER_MODULE_NAME}`
    )
  }

  try {
    const readerAppPath = fs.realpathSync(
      path.join(modulePath, READER_MODULE_DIST_DIR)
    )
    const pkg = fs.readJsonSync(
      path.join(modulePath, READER_MODULE_DIST_DIR, 'package.json')
    )
    log.warn(`Loaded ${READER_MODULE_NAME} v${pkg.version}`)

    return readerAppPath
  } catch (err) {
    throw log.error(`
                A symlinked version of ${READER_MODULE_NAME} was found but is inaccessible.
                Try running npm i -S ${READER_MODULE_NAME}, or rebuilding the reader package if running this command in a development environment
            `)
  }
}

const createOutputDirs = ({ outputDir, apiDir }: ReaderPaths) =>
  fs.ensureDir(outputDir).then(() => fs.ensureDir(apiDir))

const copyEpubToOutputDir = (ctx: BuildContext, { outputDir }: ReaderPaths) => {
  const epubDir = createDirname(getBookMetadata(ctx, 'identifier'))
  const promises = EPUB_ASSETS.map((item) =>
    fs.move(dist(ctx).root(item), path.join(outputDir, epubDir, item))
  )

  return Promise.all(promises)
}

const writeBookManifest = (ctx: BuildContext, { apiDir }: ReaderPaths) => {
  // Get metadata for books.json
  const id = getBookMetadata(ctx, 'identifier')
  const title = getBookMetadata(ctx, 'title')

  const url = `${Url.trimSlashes(remoteURL(ctx))}/${OUTPUT_DIR_NAME}/${createDirname(id)}`

  const cover = `${url}/OPS/images/${getBookMetadata(ctx, 'cover')}`

  // Get config required by reader for books.json
  const { downloads, ui_options, layout } = getProjectConfig(
    ctx
  ) as ConfigOptions

  const manifest = [{ title, url, cover, id, downloads, ui_options, layout }]

  // Write to an `api` dir in case the app is being deployed statically
  return fs.writeJson(path.join(apiDir, 'books.json'), manifest)
}

const writeWebpubManifest = (ctx: BuildContext, { outputDir }: ReaderPaths) => {
  const assetsDir = path.join(
    process.cwd(),
    outputDir,
    getBookMetadata(ctx, 'identifier'),
    'OPS'
  )
  return rrdir(assetsDir).then((files) => {
    const manifest = generateWebpubManifest(files)
    // Returned, so that the task waits for it (#770)
    return fs.writeJson(dist(ctx).root('manifest.json'), manifest)
  })
}

const injectWebpubManifestLink = (ctx: BuildContext) => {
  const indexHTML = dist(ctx).root('index.html')
  const readerURL = Url.addTrailingSlash(
    getProjectConfig(ctx, 'reader_url') as string
  )

  let contents: string
  contents = fs.readFileSync(indexHTML, 'utf8')
  contents = contents.replace(
    /<\/head>/,
    `<link rel="manifest" type="application/webpub+json" href="${readerURL}manifest.json"></head>`
  )

  return fs.writeFile(indexHTML, contents)
}

const copyReaderAppToOutputDir = (
  ctx: BuildContext,
  { readerAppPath }: ReaderPaths
) => {
  const promises = fs
    .readdirSync(readerAppPath as string)
    .map((file) =>
      fs.copy(
        path.join(readerAppPath as string, file),
        path.resolve(dist(ctx).root(file))
      )
    )

  return Promise.all(promises)
}

const injectServerDataIntoTemplate = (ctx: BuildContext) => {
  const indexHTML = dist(ctx).root('index.html')
  const readerURL = Url.addTrailingSlash(
    getProjectConfig(ctx, 'reader_url') as string
  )
  const identifier = getBookMetadata(ctx, 'identifier')
  const bookURL = `${readerURL}epub/${identifier}`
  const serverData = {
    books: [
      {
        title: getBookMetadata(ctx, 'title'),
        url: bookURL,
        cover: getBookMetadata(ctx, 'cover'),
      },
    ],
    bookURL,
    projectURL: Url.addTrailingSlash(
      getProjectConfig(ctx, 'remote_url') as string
    ),
    downloads: getProjectConfig(ctx, 'downloads'),
    basePath: Url.addTrailingSlash(
      getProjectConfig(ctx, 'base_path') as string
    ),
    loadRemoteLibrary: false,
    uiOptions: getProjectConfig(ctx, 'ui_options'),
    cache: getProjectConfig(ctx, 'cache'),
    layout: getProjectConfig(ctx, 'layout'),
  }

  let contents: string
  contents = fs.readFileSync(indexHTML, 'utf8')
  contents = contents.replace(
    /__SERVER_DATA__ = {}/,
    `__SERVER_DATA__ = ${JSON.stringify(serverData)}`
  )

  return fs.writeFile(indexHTML, contents)
}

const updateAssetURLsWithAbsolutePaths = (ctx: BuildContext) => {
  const indexHTML = dist(ctx).root('index.html')
  const readerURL = Url.removeTrailingSlash(
    getProjectConfig(ctx, 'reader_url') as string
  )

  let contents: string
  contents = fs.readFileSync(indexHTML, 'utf8')
  contents = contents.replace(/(src|href)="(\/[^"]+?)"/g, `$1="${readerURL}$2"`)

  return fs.writeFile(indexHTML, contents)
}

// Moves the epub's directory into `epub/<identifier>/`, beside the reader app
// and the manifests it loads the book from
const reader = (ctx: BuildContext): Promise<void> => {
  const paths: ReaderPaths = {
    outputDir: dist(ctx).root(OUTPUT_DIR_NAME),
    apiDir: dist(ctx).root('api'),
    readerAppPath: null,
  }

  return createOutputDirs(paths)
    .then(() => {
      paths.readerAppPath = findReaderApp()
    })
    .then(() => copyEpubToOutputDir(ctx, paths))
    .then(() => writeBookManifest(ctx, paths))
    .then(() => writeWebpubManifest(ctx, paths))
    .then(() => copyReaderAppToOutputDir(ctx, paths))
    .then(() => injectServerDataIntoTemplate(ctx))
    .then(() => updateAssetURLsWithAbsolutePaths(ctx))
    .then(() => injectWebpubManifestLink(ctx))
    .catch((err) => {
      throw log.error(err)
    })
}

export default reader
