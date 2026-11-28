import path from 'node:path'
import type { BuildContext } from '@canopycanopycanopy/b-ber-lib'
import log from '@canopycanopycanopy/b-ber-logger'
import Xml from '@canopycanopycanopy/b-ber-templates/Xml'
import fs from 'fs-extra'
import { dist } from '../context'

const write = (ctx: BuildContext) => {
  const files = [
    {
      path: path.join('META-INF', 'container.xml'),
      content: Xml.container(),
    },
    { path: 'mimetype', content: Xml.mimetype() },
  ]

  const promises = files.map((file) =>
    fs
      .writeFile(dist(ctx).root(file.path), file.content)
      .then(() => log.info('container emit [%s]', file.path))
  )

  return Promise.all(promises)
}

const makedirs = (ctx: BuildContext) => {
  const dirs = [dist(ctx).ops(), dist(ctx).root('META-INF')]
  const promises = dirs.map((dir) =>
    fs.mkdirs(dir).then(() => log.info('container emit [%s]', dir))
  )
  return Promise.all(promises)
}

// Writes the epub's `mimetype` and `META-INF/container.xml`, and creates its
// `OPS` directory. A plain function: it was a method of an instance created
// when the module was imported
const container = (ctx: BuildContext) =>
  makedirs(ctx)
    .then(() => write(ctx))
    .catch((err) => {
      throw log.error(err)
    })

export default container
