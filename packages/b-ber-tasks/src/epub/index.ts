import state from '@canopycanopycanopy/b-ber-lib/State'
import { getBookMetadata } from '@canopycanopycanopy/b-ber-lib/utils'
import log from '@canopycanopycanopy/b-ber-logger'
import zipper from 'epub-zipper'

const epub = () =>
  process.argv.includes('--no-compile')
    ? Promise.resolve()
    : zipper
        .create({
          input: state.distDir,
          output: process.cwd(),
          clean: true,
          fileName: getBookMetadata('identifier'),
        })
        .catch(log.error)

export default epub
