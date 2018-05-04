
import path from 'path'
import fs from 'fs-extra'
import log from '@canopycanopycanopy/b-ber-logger'
import state from '@canopycanopycanopy/b-ber-lib/State'
import EbookConvert from '@canopycanopycanopy/b-ber-lib/EbookConvert'

const pdf = () =>
    new Promise(resolve => {

        const opsPath = path.join(state.dist, 'OPS')
        const inputPath = path.join(opsPath, 'content.opf')

        // TODO: remove TOC manually since we don't have the option in
        // ebook-convert to skip it. should probably be done elsewhere
        const tocPath = path.join(opsPath, 'text', 'toc.xhtml')
        fs.remove(tocPath)

        return EbookConvert.convert({
            inputPath,
            outputPath: process.cwd(),
            fileType: 'pdf',
        })
            .catch(err => log.error(err))
            .then(resolve)
    })

export default pdf
