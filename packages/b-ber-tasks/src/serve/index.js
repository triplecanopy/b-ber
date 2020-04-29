import path from 'path'
import state from '@canopycanopycanopy/b-ber-lib/State'
import sequences from '@canopycanopycanopy/b-ber-shapes-sequences/sequences'
import debounce from 'lodash/debounce'
import { create } from 'browser-sync'
import { serialize } from '../'

const browserSync = create()
const port = 4000
const debounceSpeed = 500

const update = build => {
  state.update('build', build)
  state.update('config.base_url', '/')
  state.update('config.base_path', '/')
  state.update('config.remote_url', `http://localhost:${port}`)
  state.update('config.reader_url', `http://localhost:${port}`)

  return serialize(sequences[build])
}

const reload = build => update(build).then(browserSync.reload)

const watch = build => {
  browserSync.init({
    port,
    server: {
      baseDir: path.resolve(`project-${build}`),
      middleware: (req, res, next) => {
        // Set headers for XHTML files to allow document.write
        if (/\.xhtml$/.test(req.url)) {
          res.setHeader('Content-Type', 'text/html; charset=UTF-8')
        }

        next()
      },
    },
    plugins: [
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
              fn: debounce(() => reload(build), debounceSpeed, {
                leading: false,
                trailing: true,
              }),
            },
          ],
        },
      },
    ],
  })
}

const serve = ({ build }) => update(build).then(() => watch(build))

export default serve
