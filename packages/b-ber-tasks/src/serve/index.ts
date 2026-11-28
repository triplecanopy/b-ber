import type { IncomingMessage, ServerResponse } from 'node:http'
import path from 'node:path'
import {
  type BuildContext,
  createBuildContext,
  loadProject,
  type Project,
  runInBuildContext,
} from '@canopycanopycanopy/b-ber-lib'
import { create } from 'browser-sync' // eslint-disable-line import/no-unresolved
import debounce from 'lodash/debounce'
import { distDir, srcDir } from '../context'
import { build } from '../targets'

type BrowserSync = ReturnType<typeof create>

const port = 4000
const debounceSpeed = 500

// Each rebuild is a build of its own, with a new context, so that nothing a
// build collects (figures, footnotes, the spine's additions) carries over to
// the next. The URLs are the server's
const rebuild = (project: Project, target: string, url: string) => () => {
  const ctx = createBuildContext(project, target)
  Object.assign(ctx.config, {
    base_url: '/',
    base_path: '/',
    remote_url: url,
    reader_url: url,
  })

  return runInBuildContext(ctx, () => build(ctx))
}

// Browsersync's own `files` option takes exactly this {match, fn} shape, so the
// watch does not need a plugin. It used to be nested inside bs-html-injector's
// options; that worked, but the plugin was only ever carrying the config — its
// actual job, diffing and injecting HTML, was redundant against the full reload
// `fn` already performs. Removing it drops the abandoned `request` and `xmldom`
// packages, whose advisories can never be patched.
//
// Worked out from the project's source directory. They used to be fixed at
// `_project/` when the module was imported
const watchFiles = (ctx: BuildContext, reload: () => unknown) => [
  {
    match: [
      path.resolve(srcDir(ctx), '**', '*.scss'),
      path.resolve(srcDir(ctx), '**', '*.js'),
      path.resolve(srcDir(ctx), '**', '*.md'),
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
const init = (
  browserSync: BrowserSync,
  ctx: BuildContext,
  reload: () => unknown
) =>
  new Promise<void>((resolve) => {
    const options = {
      port,
      open: false, // Opens browser programatically below
      // reloadDelay: 2000
      // reloadDebounce: 2000
      // reloadThrottle: 2000
      server: {
        baseDir: path.resolve(distDir(ctx)),
        middleware: [browserSyncMiddleware],
      },
      files: watchFiles(ctx, reload),
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
  const target = buildOption || 'reader'
  const project = loadProject(process.cwd())
  const browserSync = create()

  // The first build needs the server's URL, so the watch starts before there
  // is anything to rebuild with
  let update: () => Promise<void> = async () => {}
  const reload = () => update().then(() => browserSync.reload())

  await init(browserSync, createBuildContext(project, target), reload)

  const url = browserSync.getOption('urls').get(location)

  update = rebuild(project, target, url)

  await update()

  // Update the location in the config object so that a call can be made
  // to openBrowser once the project has been built
  const bs = browserSync as unknown as BrowserSyncInternals
  bs.instance.setOption('open', location)
  bs.instance.utils.openBrowser(url, bs.instance.options, bs.instance)
}

export default serve
