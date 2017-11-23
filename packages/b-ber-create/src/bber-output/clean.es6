
/**
 * @module clean
 */

import Promise from 'zousan'
import fs from 'fs-extra'
import path from 'path'
import { dist, build } from 'bber-utils'
import log from 'b-ber-logger'

/**
 * Remove an ebook's output directory and outdated builds
 * @return {Promise<Object|Error>}
 */
const clean = _ =>
    new Promise(resolve => {
        const projectDir = dist()
        const projectRoot = path.dirname(projectDir)
        const fileType = `.${build()}`
        const oldBuilds = fs.readdirSync(projectRoot).filter(a => path.extname(a) === fileType)

        if (oldBuilds.length) {
            oldBuilds.forEach(a => fs.remove(path.join(projectRoot, a)))
            log.info('Removed [%s]', oldBuilds.join('\n'))
        }

        fs.remove(projectDir, (err) => {
            if (err) { throw err }
            log.info('Removed [%s]', projectDir)
            resolve()
        })
    })

export default clean
