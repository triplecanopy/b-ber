
/**
 * @module clean
 */

import fs from 'fs-extra'
import { dist } from 'bber-utils'
import { log } from 'bber-plugins'

/**
 * Remove an ebook's output directory
 * @param {String} [dirPath] Directory to remove
 * @return {Promise<Object|Error>}
 */
const clean = dirPath =>
  new Promise((resolve, reject) => {
    let dir = dirPath
    if (!dir) {
      try {
        dir = dist()
      } catch (err) {
        log.error(err)
        return reject(err)
      }
    }

    return fs.remove(dir, (err) => {
      if (err) { reject(err) }
      return resolve()
    })
  })

export default clean
