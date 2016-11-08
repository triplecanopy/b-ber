
import path from 'path'
import zipper from 'epub-zipper'
import logger from './logger'
import conf from './config'

const options = {
  input: path.join(__dirname, '../', conf.dist),
  output: path.join(__dirname, '../'),
  clean: true
}

const epub = () =>
  new Promise(resolve/* , reject */ =>
    zipper.create(options)
    .catch(err => logger.error(err))
    .then(resolve)
  )

export default epub
