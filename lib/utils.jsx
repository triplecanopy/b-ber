
import path from 'path'
import fs from 'fs-extra'
import { compact } from 'underscore'

import logger from './logger'

function copy(source, target) {
  return new Promise((resolve, reject) => {
    const rd = fs.createReadStream(source)
    rd.on('error', reject)
    const wr = fs.createWriteStream(target)
    wr.on('error', reject)
    wr.on('finish', resolve)
    return rd.pipe(wr)
  })
}

function slashit(str) {
  let fpath = str
  try {
    if (typeof fpath !== 'string') {
      throw new Error(`Path must be a string. '${typeof fpath}' given.`)
    }
  } catch (e) {
    logger.info(e.message)
    process.exit()
  }

  if (fpath.substr(-1) !== '/') {
    fpath = fpath.concat('/')
  }

  return fpath
}

function topdir(file) {
  return slashit(path.basename(path.dirname(file))) + path.basename(file)
}

function cjoin(arr) {
  return compact(arr).join('\n')
}

function fileid(str) {
  return '_'.concat(str.replace(/[\s:,“”‘’]/g, '_'))
}

function s4() {
  return Math.floor((1 + Math.random()) * 0x10000)
    .toString(16)
    .substring(1)
}

function guid() {
  return `${s4()}${s4()}${s4()}${s4()}${s4()}${s4()}${s4()}${s4()}`
}

export { slashit, topdir, cjoin, fileid, copy, guid }
