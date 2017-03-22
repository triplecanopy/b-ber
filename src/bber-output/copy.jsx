
/**
 * @module copy
 */

import path from 'path'
import fs from 'fs-extra'
import { src, dist } from 'bber-utils'

const cwd = process.cwd()

/**
 * Copy directories of assets into the output directory
 * @param {Array|String}  [_fromLocs] From directory/directories
 * @param {String}        [_toLoc] To directory
 * @return {Promise<Object|Error>}
 */
const copy = (_fromLocs, _toLoc) =>
  new Promise((resolve, reject) => {
    let fromLocs = _fromLocs
    let toLoc = _toLoc
    let renameFn = _ => _

    if (!fromLocs.length) {
      fromLocs = [
        path.join(src(), '_images'),
        path.join(src(), '_fonts')
      ]
      renameFn = _ => _.slice(1)
    }

    if (toLoc) {
      toLoc = path.resolve(cwd, toLoc)
      fs.ensureDirSync(toLoc)
    } else {
      toLoc = path.join(dist(), 'OPS')
    }

    return fromLocs.forEach((_, idx) => {
      const i = path.resolve(cwd, _)
      const o = path.join(toLoc, renameFn(_))
      fs.copy(i, o, (err) => {
        if (err) { reject(err) }
        if (idx === fromLocs.length - 1) { resolve() }
      })
    })
  })


export default copy
