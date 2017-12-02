/**
 * @module copy
 */

import Promise from 'zousan'
import path from 'path'
import fs from 'fs-extra'
import log from 'b-ber-logger'
import { src, dist } from 'bber-utils'

const FILE_SIZE_WARNING_LIMIT = 1500000 // 1.5Mb

/**
 * Copy directories of assets into the output directory
 * @param {Array|String}  [_fromLocs] From directory/directories
 * @param {String}        [_toLoc] To directory
 * @return {Promise<Object|Error>}
 */
const copy = () =>
    new Promise((resolve) => {

        const promises = []

        const dirs = [
            { from: path.join(src(), '_images'), to: path.join(dist(), 'OPS', 'images') },
            { from: path.join(src(), '_fonts'), to: path.join(dist(), 'OPS', 'fonts') },
            { from: path.join(src(), '_media'), to: path.join(dist(), 'OPS', 'media') },
        ]

        dirs.forEach((_) => {
            promises.push(new Promise((resolve) => {
                try {
                    fs.mkdirpSync(_.to)
                    fs.copySync(_.from, _.to, {
                        overwrite: false,
                        errorOnExist: true,
                        filter: file => path.basename(file).charAt(0) !== '.',
                    })
                } catch (err) {
                    throw err
                }

                const baseTo   = `${path.basename(_.to)}`

                fs.readdirSync(_.to).forEach(file => {
                    const size = fs.statSync(path.join(_.to, file)).size
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
