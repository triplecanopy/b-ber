/**
 * @module copy
 */

import Promise from 'zousan'
import path from 'path'
import fs from 'fs-extra'
import { log } from 'bber-plugins'
import { src, dist } from 'bber-utils'

const cwd = process.cwd()

const report = (i, o) => {
  log.info(`bber-output/copy: Copied contents of [${i}] to [${o}]`)
  fs.readdir(i, (err, data) => {
    if (err) { throw err }
    data.forEach(_ => log.info(`bber-output/copy: ${path.basename(i)}/${_} -> ${path.basename(o)}/${_}`))
  })
}

const doCopy = (i, o, idx, fromLocs, resolve) => {
  fs.copy(i, o, (err4) => {
    if (err4) { throw err4 }
    report(i, o)
    if (idx === fromLocs.length - 1) {
      resolve()
    }
  })
}

/**
 * Copy directories of assets into the output directory
 * @param {Array|String}  [_fromLocs] From directory/directories
 * @param {String}        [_toLoc] To directory
 * @return {Promise<Object|Error>}
 */
const copy = (_fromLocs, _toLoc) =>
  new Promise((resolve) => {
    let fromLocs = _fromLocs
    let toLoc = _toLoc
    let renameFn = _ => _

    if (!fromLocs || !fromLocs.length) {
      fromLocs = [
        path.join(src(), '_images'),
        path.join(src(), '_fonts'),
      ]
      renameFn = _ => _.slice(1)
    }

    if (toLoc) {
      toLoc = path.resolve(cwd, toLoc)
    } else {
      toLoc = path.join(dist(), 'OPS')
    }

    return fs.mkdirs(toLoc, (err0) => {
      if (err0) { throw err0 }
      return fromLocs.forEach((_, idx) => {
        const i = path.resolve(cwd, _)
        const o = path.resolve(toLoc, renameFn(path.basename(_)))

        try {
          if (!fs.existsSync(i)) {
            throw new Error(`bber-output/copy: Nothing to copy at [${i}]`)
          }
        } catch (err1) {
          if (idx === fromLocs.length - 1) { resolve() }
          return log.warn(err1.message)
        }

        try {
          if (!fs.existsSync(o)) {
            throw new Error(`bber-output/copy: Path [${o}] does not exist, creating empty directory`)
          }
        } catch (err2) {
          log.warn(err2.message)
          return fs.mkdirs(o, (err3) => {
            if (err3) { throw err3 }
            doCopy(i, o, idx, fromLocs, resolve)
          })
        }

        return fs.copy(i, o, (err5) => {
          if (err5) { throw err5 }
          log.info(`bber-output/copy: Copied contents of ${i} to ${o}`)
          report(i, o)
          doCopy(i, o, idx, fromLocs, resolve)
        })
      })
    })
  })


export default copy
