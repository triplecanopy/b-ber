import log from '@canopycanopycanopy/b-ber-logger'
import state from '@canopycanopycanopy/b-ber-lib/State'
import EbookConvert from '@canopycanopycanopy/b-ber-lib/EbookConvert'
import { getBookMetadata } from '@canopycanopycanopy/b-ber-lib/utils'

const pageBreakBeforeXPATH = () =>
    [
        '//h:*[@class="figure__large figure__inline"]',
        '//h:*[@class="figure__large figure__inline"]/following::h:p[1]',
        '//h:*[re:test(@style, "page-break-before:\\s*?always")]',
        '//h:*[@data-gallery-item]',
    ].join('|')

const mobi = () =>
    process.argv.includes('--no-compile')
        ? Promise.resolve()
        : EbookConvert.convert({
              inputPath: state.dist.ops('content.opf'),
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

export default mobi
