
import cdir from 'copy-dir'
import path from 'path'
import conf from './config'

// TODO: add other static assets here, as we are now moving from src/ do dist/

const input = path.join(__dirname, `../${conf.src}`, '_images')
const output = path.join(__dirname, `../${conf.dist}`, 'OPS/images')

const copy = () =>
  new Promise((resolve, reject) =>
    cdir(input, output, (err) => {
      if (err) { reject(new Error(err)) }
      resolve()
    })
  )


export default copy
