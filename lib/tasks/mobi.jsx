
import zipper from 'mobi-zipper'
import path from 'path'
import { log } from '../log'
import conf from '../config'

const cwd = process.cwd()

const options = {
  input: path.join(cwd, conf.dist, 'OPS/content.opf'),
  output: cwd,
  clean: true
}

const mobi = () =>
  new Promise(resolve/* , reject */ => {
    console.log('run mobi')
    resolve()
  }
    // zipper.create(options)
    // .catch(err => log.error(err))
    // .then(resolve)
  )

export default mobi
