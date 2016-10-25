
// TODO: better w/o gulp?

import path from 'path'
import fs from 'fs-extra'
import rrdir from 'recursive-readdir'

import conf from './config'
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
        console.log('scripts done')
        resolve()
      }
    })
  })
}

const scripts = () =>
  new Promise((resolve, reject) => {
    try {
      if (fs.statSync(dest)) {
        write(resolve, reject)
      }
    } catch (e) {
      fs.mkdirs(dest, (err) => {
        if (err) { reject(err) }
        write(resolve, reject)
      })
    }
  })

export default scripts
