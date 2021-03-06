import path from 'path'
import fs from 'fs-extra'
import state from '@canopycanopycanopy/b-ber-lib/State'
import log from '@canopycanopycanopy/b-ber-logger'

// Remove an ebook's output directory and outdated builds
const clean = () => {
  const projectRoot = path.dirname(state.distDir)
  const fileType = `.${state.build}`

  const promises = fs
    .readdirSync(projectRoot)
    .filter(a => path.extname(a) === fileType)
    .map(b =>
      fs
        .remove(path.join(projectRoot, b))
        .then(() => log.info('clean remove [%s]', b))
    )

  return Promise.all(promises).then(() =>
    fs
      .remove(state.distDir)
      .then(() => log.info('clean remove [%s]', state.distDir))
  )
}

export default () => clean().catch(log.error)
