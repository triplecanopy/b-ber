import path from 'node:path'
import type { BuildContext } from '@canopycanopycanopy/b-ber-lib'
import log from '@canopycanopycanopy/b-ber-logger'
import fs from 'fs-extra'
import isArray from 'lodash/isArray'
import { dist, src } from '../context'

const FILE_SIZE_WARNING_LIMIT = 1500000 // 1.5Mb
const cwd = process.cwd()

// Copy directories of assets into the output directory
const copy = (ctx: BuildContext) => {
  const rawIgnore: string[] = isArray(ctx.config.ignore)
    ? (ctx.config.ignore as string[])
    : []
  const ignoreMap = rawIgnore.reduce<Record<string, boolean>>((acc, curr) => {
    acc[path.resolve(cwd, curr)] = true
    return acc
  }, {})

  const from = src(ctx)
  const to = dist(ctx)
  const dirs = [
    {
      from: path.resolve(from.images()),
      to: path.resolve(to.images()),
    },
    {
      from: path.resolve(from.fonts()),
      to: path.resolve(to.fonts()),
    },
    {
      from: path.resolve(from.media()),
      to: path.resolve(to.media()),
    },
  ].filter((dir) => !ignoreMap[dir.from])

  const promises = dirs.map((dir) =>
    fs
      .mkdirp(dir.to)
      .then(() => fs.mkdirp(dir.from))
      .then(() =>
        fs.copy(dir.from, dir.to, {
          overwrite: false,
          filter: (file: string) =>
            path.basename(file).charAt(0) !== '.' && !ignoreMap[file],
        })
      )
      .then(() => fs.readdir(dir.to))
      .then((files) => {
        const baseTo = `${path.basename(dir.to)}`
        files.forEach((file) => {
          const { size } = fs.statSync(path.join(dir.to, file))

          log.info('copy [%s - {%d}]', `${baseTo}/${file}`, size)

          if (size > FILE_SIZE_WARNING_LIMIT) {
            log.warn(
              'copy [%s - {%d}] Large file sizes may cause performance issues in some output formats',
              file,
              size
            )
          }
        })
      })
  )

  return Promise.all(promises).catch((err) => {
    throw log.error(err)
  })
}

export default copy
