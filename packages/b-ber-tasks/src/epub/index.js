import zipper from 'epub-zipper'
import log from '@canopycanopycanopy/b-ber-logger'
import state from '@canopycanopycanopy/b-ber-lib/State'
import { getBookMetadata } from '@canopycanopycanopy/b-ber-lib/utils'

const epub = () =>
  process.argv.includes('--no-compile')
    ? Promise.resolve()
    : zipper
        .create({
          input: state.distDir,
          output: process.cwd(),
          clean: true,
          fileName: getBookMetadata('identifier', state),
        })
        .catch(log.error)

export default epub
