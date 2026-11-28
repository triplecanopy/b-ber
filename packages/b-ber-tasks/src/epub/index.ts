import type { BuildContext } from '@canopycanopycanopy/b-ber-lib'
import log from '@canopycanopycanopy/b-ber-logger'
import zipper from 'epub-zipper'
import { bookMetadata, distDir } from '../context'

// Zips the build's directory into `<identifier>.epub` in the working
// directory, unless `--no-compile` is given
const epub = (ctx: BuildContext): Promise<void> =>
  process.argv.includes('--no-compile')
    ? Promise.resolve()
    : zipper
        .create({
          input: distDir(ctx),
          output: process.cwd(),
          clean: true,
          fileName: bookMetadata(ctx, 'identifier'),
        })
        .catch((err) => {
          throw log.error(err)
        })

export default epub
