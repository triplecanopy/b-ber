
import zipper from 'mobi-zipper'
import path from 'path'
import logger from './logger'
import conf from './config'

const options = {
  input: path.join(__dirname, '../', conf.dist, 'OPS/content.opf'),
  output: path.join(__dirname, '../'),
  clean: true
}

const mobi = () =>
  new Promise(resolve/* , reject */ =>
    zipper.create(options)
    .catch(err => logger.error(err))
    .then(resolve)
  )

export default mobi
