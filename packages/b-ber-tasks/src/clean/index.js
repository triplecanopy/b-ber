/* eslint-disable valid-jsdoc */

/**
 * @module clean
 */


import path from 'path'
import fs from 'fs-extra'
import state from '@canopycanopycanopy/b-ber-lib/State'
import log from '@canopycanopycanopy/b-ber-logger'

/**
 * Remove an ebook's output directory and outdated builds
 * @return {Promise<Object|Error>}
 */
const clean = () =>
    new Promise(resolve => {

        const dir_ = state.dist
        path.resolve(process.cwd(), dir_)

        const projectRoot = path.dirname(dir_)
        const fileType = `.${state.build}`
        const oldBuilds = fs.readdirSync(projectRoot).filter(a => path.extname(a) === fileType)

        if (oldBuilds.length) {
            oldBuilds.forEach(a => fs.remove(path.join(projectRoot, a)))
            log.info('clean remove [%s]', oldBuilds.join('\n'))
        }

        fs.remove(dir_, err => {
            if (err) throw err
            log.info('clean remove [%s]', dir_)
            resolve()
        })
    })

export default clean
