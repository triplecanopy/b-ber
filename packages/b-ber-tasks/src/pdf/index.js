import path from 'path'
import fs from 'fs-extra'
import log from '@canopycanopycanopy/b-ber-logger'
import state from '@canopycanopycanopy/b-ber-lib/State'
import EbookConvert from '@canopycanopycanopy/b-ber-lib/EbookConvert'
import { getBookMetadata } from '@canopycanopycanopy/b-ber-lib/utils'

const pdf = () => {
    const opsPath = path.join(state.dist, 'OPS')
    const inputPath = path.join(opsPath, 'content.opf')

    // TODO: remove TOC manually since we don't have the option in
    // ebook-convert to skip it. should probably be done elsewhere
    // @issue: https://github.com/triplecanopy/b-ber/issues/230
    const tocPath = path.join(opsPath, 'toc.xhtml')

    return fs.remove(tocPath).then(() =>
        process.argv.includes('--no-compile')
            ? Promise.resolve()
            : EbookConvert.convert({
                  inputPath,
                  outputPath: process.cwd(),
                  fileType: 'pdf',
                  fileName: getBookMetadata('identifier', state),
              }).catch(log.error),
    )
}

export default pdf
