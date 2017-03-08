
/**
 * @module clean
 */

import fs from 'fs-extra'
import { dist } from '../utils'

/**
 * Remove an ebook's output directory
 * @return {Promise<Object|Error>}
 */
const clean = () =>
  new Promise((resolve, reject) => {
    fs.remove(dist(), (err) => {
      if (err) { reject(err) }
      resolve()
    })
  })

export default clean
