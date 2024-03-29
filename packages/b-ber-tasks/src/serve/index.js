import path from 'path'
import state from '@canopycanopycanopy/b-ber-lib/State'
import sequences from '@canopycanopycanopy/b-ber-shapes-sequences/sequences'
import debounce from 'lodash/debounce'
import { create } from 'browser-sync'
import { serialize } from '..'

const browserSync = create()
const port = 4000
const debounceSpeed = 500

const config = build => url => () => {
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

const reload = () => update().then(browserSync.reload)

const browserSyncPlugins = [
  {
    module: 'bs-html-injector',
    options: {
      files: [
        {
          match: [
            path.resolve('_project', '**', '*.scss'),
            path.resolve('_project', '**', '*.js'),
            path.resolve('_project', '**', '*.md'),
          ],
          fn: debounce(() => reload(), debounceSpeed, {
            leading: false,
            trailing: true,
          }),
        },
      ],
    },
  },
]

const browserSyncMiddleware = (req, res, next) => {
  // Set headers for XHTML files to allow document.write
  if (/\.xhtml$/.test(req.url)) {
    res.setHeader('Content-Type', 'text/html; charset=UTF-8')
  }

  next()
}

const init = build =>
  new Promise(resolve => {
    const options = {
      port,
      open: false, // Opens browser programatically below
      // reloadDelay: 2000
      // reloadDebounce: 2000
      // reloadThrottle: 2000
      server: {
        baseDir: path.resolve(`project-${build}`),
        middleware: browserSyncMiddleware,
      },
      plugins: browserSyncPlugins,
    }

    browserSync.init(options, resolve)
  })

const serve = async ({ build: buildOption, external }) => {
  const location = external ? 'external' : 'local'
  const build = buildOption || 'reader'

  await init(build)

  const url = browserSync.getOption('urls').get(location)

  update = config(build)(url)

  await update()

  // Update the location in the config object so that a call can be made
  // to openBrowser once the project has been built
  browserSync.instance.setOption('open', location)
  browserSync.instance.utils.openBrowser(
    url,
    browserSync.instance.options,
    browserSync.instance
  )
}

export default serve
