/**
 * @module epub
 */


import zipper from 'epub-zipper'
import log from '@canopycanopycanopy/b-ber-logger'
import state from '@canopycanopycanopy/b-ber-lib/State'

/**
 * Compiles epub
 * @return {Promise<Object|Error>}
 */
const epub = () =>
    new Promise(resolve =>
        zipper.create({
            input: state.dist,
            output: process.cwd(),
            clean: true,
        })
            .catch(err => log.error(err))
            .then(resolve)
    )


export default epub
