
/**
 * @module clean
 */

import Promise from 'zousan'
import fs from 'fs-extra'
import { dist } from 'bber-utils'
import { log } from 'bber-plugins'

/**
 * Remove an ebook's output directory
 * @param {String} [dirPath] Directory to remove
 * @return {Promise<Object|Error>}
 */
const clean = dirPath =>
  new Promise(resolve =>
    fs.remove(dirPath || dist(), (err) => {
      if (err) { throw err }
      ;log.info(`bber-output/clean: Removed [${dirPath || dist()}]`)
      resolve()
    })
  )

export default clean
