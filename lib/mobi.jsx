
import zipper from 'mobi-zipper'
import path from 'path'
import log from './log'
import conf from './config'

const options = {
  input: path.join(__dirname, '../', conf.dist, 'OPS/content.opf'),
  output: path.join(__dirname, '../'),
  clean: true
}

const mobi = () =>
  new Promise(resolve/* , reject */ =>
    zipper.create(options)
    .catch(err => log.error(err))
    .then(resolve)
  )

export default mobi
