/**
 * @module copy
 */


import path from 'path'
import fs from 'fs-extra'
import log from '@canopycanopycanopy/b-ber-logger'
import state from '@canopycanopycanopy/b-ber-lib/State'

const FILE_SIZE_WARNING_LIMIT = 1500000 // 1.5Mb

/**
 * Copy directories of assets into the output directory
 * @param {Array|String}  [_fromLocs] From directory/directories
 * @param {String}        [_toLoc] To directory
 * @return {Promise<Object|Error>}
 */
const copy = () =>
    new Promise(resolve => {

        const promises = []

        const dirs = [
            {from: path.join(state.src, '_images'), to: path.join(state.dist, 'OPS', 'images')},
            {from: path.join(state.src, '_fonts'), to: path.join(state.dist, 'OPS', 'fonts')},
            {from: path.join(state.src, '_media'), to: path.join(state.dist, 'OPS', 'media')},
        ]

        dirs.forEach(a => {
            promises.push(new Promise(resolve => {
                try {
                    fs.mkdirpSync(a.to)
                    fs.mkdirpSync(a.from) // ensure `from` dir exists

                    fs.copySync(a.from, a.to, {
                        overwrite: false,
                        errorOnExist: true,
                        filter: file => path.basename(file).charAt(0) !== '.',
                    })
                } catch (err) {
                    throw err
                }

                const baseTo   = `${path.basename(a.to)}`

                fs.readdirSync(a.to).forEach(file => {
                    const size = fs.statSync(path.join(a.to, file)).size
                    log.info('Copied [%s] {%d}', `${baseTo}/${file}`, size)
                    if (size > FILE_SIZE_WARNING_LIMIT) {
                        log.warn('[%s]:{%d Kb} exceeds the recommended file size of {%d Kb}', file, size / 1000, FILE_SIZE_WARNING_LIMIT / 1000)
                    }
                })

                resolve()
            }))
        })

        Promise.all(promises).catch(err => log.error(err)).then(resolve)


    })


export default copy
