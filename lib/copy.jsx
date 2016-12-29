
import cdir from 'copy-dir'
import path from 'path'
import conf from './config'

// TODO: add other static assets here, as we are now moving from src/ do dist/

const cwd = process.cwd()
const input = path.join(cwd, conf.src, '_images')
const output = path.join(cwd, conf.dist, 'OPS/images')

const copy = () =>
  new Promise((resolve, reject) =>
    cdir(input, output, (err) => {
      if (err) { reject(err) }
      resolve()
    })
  )


export default copy
