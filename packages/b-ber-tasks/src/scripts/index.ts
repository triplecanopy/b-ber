import path from 'node:path'
import type { BuildContext } from '@canopycanopycanopy/b-ber-lib'
import log from '@canopycanopycanopy/b-ber-logger'
import fs from 'fs-extra'
import uglifyJS from 'uglify-js'
import { dist, env, src } from '../context'

// config.yml's `uglify_options`, read when the task runs. It used to be read
// from State when the module was imported, so a target's section of
// config.yml and the command line could not change it (TASK-162's bug 4)
const uglifyOptions = (ctx: BuildContext) =>
  ctx.config.uglify_options || {
    compress: {
      // eslint-disable-next-line camelcase
      dead_code: true,
      conditionals: true,
      booleans: true,
    },
  }

const uglify = (ctx: BuildContext, contents: string) => {
  const result = uglifyJS.minify(contents, uglifyOptions(ctx))
  if (result.error) throw result.error
  if (result.warnings) log.warn(result.warnings)
  return result.code
}

const optimized = (ctx: BuildContext, files: string[]): Promise<void> => {
  const contents = files
    .map((file: string) =>
      fs.readFileSync(path.resolve(src(ctx).javascripts(file)), 'utf8')
    )
    .join('')
  const js = uglify(ctx, contents)
  const { hash } = ctx
  const out = dist(ctx).javascripts(`${hash}.js`)

  return fs
    .writeFile(out, js)
    .then(() =>
      log.info(
        'scripts emit [%s]',
        `javascripts${path.sep}${path.basename(out)}`
      )
    )
}

const unoptimized = (ctx: BuildContext, files: string[]): Promise<void[]> => {
  const promises = files.map((file: string) => {
    const input = src(ctx).javascripts(file)
    const output = dist(ctx).javascripts(file)
    return fs
      .copy(input, output)
      .then(() =>
        log.info(
          'scripts emit [%s]',
          `javascripts${path.sep}${path.basename(output)}`
        )
      )
  })

  return Promise.all(promises)
}

const write = (ctx: BuildContext) =>
  fs.readdir(src(ctx).javascripts()).then((_files) => {
    const files = _files.filter((a) => path.extname(a) === '.js')
    return (env() === 'production' ? optimized : unoptimized)(
      ctx,
      files
    ) as Promise<void>
  })

const ensureDir = (ctx: BuildContext) => fs.mkdirp(dist(ctx).javascripts())

const scripts = (ctx: BuildContext) =>
  ensureDir(ctx)
    .then(() => write(ctx))
    .catch((err) => {
      throw log.error(err)
    })

export default scripts
