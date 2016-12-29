
import path from 'path'
import fs from 'fs-extra'
import conf from './config'

const cwd = process.cwd()
const dist = path.join(cwd, conf.dist)

const clean = () =>
  new Promise((resolve, reject) =>
    fs.remove(dist, (err) => {
      if (err) { reject(err) }
      resolve()
    })
  )

export default clean
