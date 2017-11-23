import Promise from 'zousan'
import path from 'path'
import fs from 'fs-extra'
import log from 'b-ber-logger'
import { dist } from 'bber-utils'
import EbookConvert from 'bber-lib/EbookConvert'

const pdf = () =>
    new Promise(resolve => {

        const opsPath = path.join(dist(), 'OPS')
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
