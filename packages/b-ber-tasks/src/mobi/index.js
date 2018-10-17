/**
 * @module mobi
 */

import path from 'path'
import log from '@canopycanopycanopy/b-ber-logger'
import state from '@canopycanopycanopy/b-ber-lib/State'
import EbookConvert from '@canopycanopycanopy/b-ber-lib/EbookConvert'
import { getBookMetadata } from '@canopycanopycanopy/b-ber-lib/utils'

const pageBreakBeforeXPATH = () =>
    [
        '//h:*[@class="figure__large figure__inline"]',
        '//h:*[@class="figure__large figure__inline"]/following::h:p[1]',
        '//h:*[@style="page-break-before:always;"]', // TODO: this is too strict if the XHTML changes, calibre supports regex in xpath, should use that
    ].join('|')

const mobi = () => {
    const opsPath = path.join(state.dist, 'OPS')
    const inputPath = path.join(opsPath, 'content.opf')

    return EbookConvert.convert({
        inputPath,
        outputPath: process.cwd(),
        fileType: 'mobi',
        fileName: getBookMetadata('identifier', state),
        flags: [
            '--mobi-file-type=both',
            '--disable-font-rescaling',
            '--no-inline-toc',
            '--chapter="/"',
            '--chapter-mark=none',
            '--disable-remove-fake-margins',
            `--page-breaks-before='${pageBreakBeforeXPATH()}'`,
        ],
    }).catch(log.error)
}

export default mobi
