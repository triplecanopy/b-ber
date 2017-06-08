/**
 * @module epub
 */

import Promise from 'vendor/Zousan'
import zipper from 'epub-zipper'
import { log } from 'bber-plugins'
import { dist } from 'bber-utils'

/**
 * Compiles epub
 * @return {Promise<Object|Error>}
 */
const epub = () =>
  new Promise.resolve()
  // new Promise(resolve =>
  //   zipper.create({
  //     input: dist(),
  //     output: process.cwd(),
  //     clean: true,
  //   })
  //   .catch(err => log.error(err))
  //   .then(resolve)
  // )

export default epub
