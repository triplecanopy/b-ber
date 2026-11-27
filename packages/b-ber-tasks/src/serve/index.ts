import type { IncomingMessage, ServerResponse } from 'node:http'
import path from 'node:path'
import state from '@canopycanopycanopy/b-ber-lib/State'
import sequences from '@canopycanopycanopy/b-ber-shapes-sequences/sequences'
import { create } from 'browser-sync' // eslint-disable-line import/no-unresolved
import debounce from 'lodash/debounce'
import serialize from '../serialize'

const browserSync = create()
const port = 4000
const debounceSpeed = 500

const config = (build: string) => (url: string) => () => {
  state.update('build', build)
  state.update('footnotes', [])
  state.update('config.base_url', '/')
  state.update('config.base_path', '/')
  state.update('config.remote_url', url)
  state.update('config.reader_url', url)

  return serialize(sequences[build])
}

// Declared below once browserSync has been initialized
let update = async () => {}

const reload = () => update().then(() => browserSync.reload())

// Browsersync's own `files` option takes exactly this {match, fn} shape, so the
// watch does not need a plugin. It used to be nested inside bs-html-injector's
// options; that worked, but the plugin was only ever carrying the config — its
// actual job, diffing and injecting HTML, was redundant against the full reload
// `fn` already performs. Removing it drops the abandoned `request` and `xmldom`
// packages, whose advisories can never be patched.
//
// Worked out once the build is set, from the project's source directory: they
// used to be fixed at `_project/` when the module was imported
const watchFiles = () => [
  {
    match: [
      path.resolve(state.srcDir, '**', '*.scss'),
      path.resolve(state.srcDir, '**', '*.js'),
      path.resolve(state.srcDir, '**', '*.md'),
    ],
    fn: debounce(() => reload(), debounceSpeed, {
      leading: false,
      trailing: true,
    }),
  },
]

const browserSyncMiddleware = (
  req: IncomingMessage,
  res: ServerResponse,
  next: () => void
) => {
  // Set headers for XHTML files to allow document.write
  if (/\.xhtml$/.test(req.url ?? '')) {
    res.setHeader('Content-Type', 'text/html; charset=UTF-8')
  }

  next()
}

// Serves the build's own directory, which config.yml's `dist` names. It used to
// be `project-<build>` whatever `dist` said
const init = () =>
  new Promise<void>((resolve) => {
    const options = {
      port,
      open: false, // Opens browser programatically below
      // reloadDelay: 2000
      // reloadDebounce: 2000
      // reloadThrottle: 2000
      server: {
        baseDir: path.resolve(state.distDir),
        middleware: [browserSyncMiddleware],
      },
      files: watchFiles(),
    }

    browserSync.init(options, () => resolve())
  })

// Browsersync's public API cannot change `open` after init, or open a browser
// on demand. These internals can; its types do not describe them
interface BrowserSyncInternals {
  instance: {
    options: unknown
    setOption(name: string, value: unknown): void
    utils: {
      openBrowser(url: string, options: unknown, instance: unknown): void
    }
  }
}

const serve = async ({
  build: buildOption,
  external,
}: {
  build?: string
  external?: boolean
}) => {
  const location = external ? 'external' : 'local'
  const build = buildOption || 'reader'

  state.update('build', build)
  await init()

  const url = browserSync.getOption('urls').get(location)

  update = config(build)(url) as () => Promise<void>

  await update()

  // Update the location in the config object so that a call can be made
  // to openBrowser once the project has been built
  const bs = browserSync as unknown as BrowserSyncInternals
  bs.instance.setOption('open', location)
  bs.instance.utils.openBrowser(url, bs.instance.options, bs.instance)
}

export default serve
