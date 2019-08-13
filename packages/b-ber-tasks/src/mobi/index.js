import log from '@canopycanopycanopy/b-ber-logger'
import state from '@canopycanopycanopy/b-ber-lib/State'
import EbookConvert from '@canopycanopycanopy/b-ber-lib/EbookConvert'
import { getBookMetadata } from '@canopycanopycanopy/b-ber-lib/utils'

const pageBreakBeforeXPATH = () =>
    [
        // eslint-disable-next-line no-useless-escape
        '//h:*\[@class="figure__large figure__inline"\]', // prettier-ignore
        // eslint-disable-next-line no-useless-escape
        '//h:*\[@class="figure__large figure__inline"\]/following::h:p[1]', // prettier-ignore
        // eslint-disable-next-line no-useless-escape
        '//h:*\[contains(@class, "break-before")\]', // prettier-ignore
        // eslint-disable-next-line no-useless-escape
        '//h:*\[@data-gallery-item\]', // prettier-ignore
    ].join('|')

const mobi = () =>
    process.argv.includes('--no-compile')
        ? Promise.resolve()
        : EbookConvert.convert({
              // https://manual.calibre-ebook.com/generated/en/ebook-convert.html#mobi-output-options
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
