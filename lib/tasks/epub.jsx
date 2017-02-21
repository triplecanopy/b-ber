
import path from 'path'
import zipper from 'epub-zipper'
import { log } from '../log'
import conf from '../config'

const cwd = process.cwd()

const options = {
  input: path.join(cwd, conf.dist),
  output: cwd,
  clean: true
}

const epub = () =>
  new Promise(resolve/* , reject */ => {
    console.log('run epub')
    resolve()
  }
    // zipper.create(options)
    // .catch(err => log.error(err))
    // .then(resolve)
  )

export default epub
