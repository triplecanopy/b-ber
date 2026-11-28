import path from 'node:path'
import type { BuildContext } from '@canopycanopycanopy/b-ber-lib'
import log from '@canopycanopycanopy/b-ber-logger'
import fs from 'fs-extra'
import { distDir } from '../context'

// Remove an ebook's output directory and outdated builds: the target's files
// beside it, `*.<target>`, and the directory itself
const clean = (ctx: BuildContext) => {
  const dir = distDir(ctx)
  const projectRoot = path.dirname(dir)
  const fileType = `.${ctx.target.name}`

  const promises = fs
    .readdirSync(projectRoot)
    .filter((a) => path.extname(a) === fileType)
    .map((b) =>
      fs
        .remove(path.join(projectRoot, b))
        .then(() => log.info('clean remove [%s]', b))
    )

  return Promise.all(promises).then(() =>
    fs.remove(dir).then(() => log.info('clean remove [%s]', dir))
  )
}

export default (ctx: BuildContext) =>
  clean(ctx).catch((err) => {
    throw log.error(err)
  })
