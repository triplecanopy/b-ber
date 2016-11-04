
import path from 'path'
import fs from 'fs-extra'
import rrdir from 'recursive-readdir'

import conf from './config'
import { copy } from './utils'

const src = path.join(__dirname, `../${conf.src}/_javascripts`)
const dest = path.join(__dirname, `../${conf.dist}/OPS/javascripts`)

const write = () =>
  new Promise((resolve, reject) =>
    rrdir(src, (err, files) => {
      if (err) { reject(new Error(err)) }
      const filearr = files
      filearr.forEach((file, idx) => {
        copy(file, `${dest}/${path.basename(file)}`)
        if (idx === filearr.length - 1) {
          resolve()
        }
      })
    })
  )

const scripts = () =>
  new Promise((resolve, reject) => {
    fs.mkdirs(dest, (err) => {
      if (err) { reject(new Error(err)) }
      write().then(resolve)
    })
  })

export default scripts
