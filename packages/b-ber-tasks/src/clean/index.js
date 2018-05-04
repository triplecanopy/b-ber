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
const clean = _ =>
    new Promise(resolve => {
        const projectDir = state.dist

        const projectRoot = path.dirname(projectDir)
        const fileType = `.${state.build}`
        const oldBuilds = fs.readdirSync(projectRoot).filter(a => path.extname(a) === fileType)

        if (oldBuilds.length) {
            oldBuilds.forEach(a => fs.remove(path.join(projectRoot, a)))
            log.info('remove [%s]', oldBuilds.join('\n'))
        }

        fs.remove(projectDir, err => {
            if (err) throw err
            log.info('remove [%s]', projectDir)
            resolve()
        })
    })

export default clean
