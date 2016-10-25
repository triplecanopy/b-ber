
import cdir from 'copy-dir'
import path from 'path'
import conf from './config'

// TODO: add other static assets here, as we are now moving from src/ do dist/

const input = path.join(__dirname, `../${conf.src}`, '_images')
const output = path.join(__dirname, `../${conf.dist}`, 'OPS/images')

const copy = () => {
  cdir(input, output, (err) => {
    if (err) { throw err }
    console.log('copy done')
  })
}

export default copy
