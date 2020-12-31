import fs from 'fs-extra'
import path from 'path'
import state from '@canopycanopycanopy/b-ber-lib/State'
import log from '@canopycanopycanopy/b-ber-logger'
import validator, { colors, report } from '@canopycanopycanopy/b-ber-validator'

const validate = async ({ project }) => {
  const markdownPath = path.resolve(
    process.cwd(),
    project,
    state.src.markdown()
  )

  if (!fs.pathExists(markdownPath)) {
    log.error('Project path does not exist, aborting')
  }

  const files = (await fs.readdir(markdownPath))
    .filter(f => f.slice(-2).toLowerCase() === 'md')
    .map(f => path.join(markdownPath, f))

  const errors = []
  const check = files.map(async file => {
    const data = await fs.readFile(file, 'utf8')
    const res = validator({ text: data, index: 0 })

    if (res.success === false) {
      console.log()
      console.log(colors.fgred, `Error in ${path.basename(file)}`)

      report(path.basename(file), res)
      errors.push(res)
    } else {
      log.info('Validates Ok %s', path.basename(file))
    }
  })

  await Promise.all(check)

  if (!errors.length) {
    log.notice('Markdown valid')
  }

  log.info(errors)
}

export default validate
