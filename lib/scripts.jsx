
import path from 'path'
import fs from 'fs-extra'
import rrdir from 'recursive-readdir'

import conf from './config'
import logger from './logger'
import { copy } from './utils'

const src = path.join(__dirname, `../${conf.src}/_javascripts`)
const dest = path.join(__dirname, `../${conf.dist}/OPS/javascripts`)

const write = (resolve, reject) => {
  rrdir(src, (err, files) => {
    if (err) { reject(err) }
    const filearr = files
    filearr.forEach((file, idx) => {
      copy(file, `${dest}/${path.basename(file)}`)
      if (idx === filearr.length - 1) {
        logger.info('scripts done')
        resolve()
      }
    })
  })
}

const scripts = () =>
  new Promise((resolve, reject) => {
    fs.mkdirs(dest, (err) => {
      if (err) { reject(err) }
      write(resolve, reject)
    })
  })

export default scripts
