/**
 * @module mobi
 */

import Promise from 'zousan'
import zipper from 'mobi-zipper'
import path from 'path'
import log from 'b-ber-logger'
import { dist } from 'bber-utils'

const pageBreakBeforeXPATH = () => {
    return [
        '//div[@class="figure__large figure__inline"]',
        '//div[@class="figure__large figure__inline"]/following::p[1]',
        '//*[@style="page-break-before:always;"]', // TODO: this is too strict if the XHTML changes
    ].join('|')
}

const mobi = () =>
    new Promise(resolve =>
        zipper.create({
            input: path.join(dist(), 'OPS', 'content.opf'),
            output: process.cwd(),
            clean: true,
            flags: [
                '--mobi-file-type=both',
                '--disable-font-rescaling',
                '--no-inline-toc',
                '--chapter="/"',
                '--chapter-mark=none',
                '--disable-remove-fake-margins',
                `--page-breaks-before='${pageBreakBeforeXPATH()}'`,
            ],
        })
        .catch(err => log.error(err))
        .then(resolve)
    )

export default mobi
