
import zipper from 'epub-zipper'
import { log } from '../log'
import { dist } from '../utils'

const options = {
  input: dist(),
  output: process.cwd(),
  clean: true
}

const epub = () =>
  new Promise(resolve/* , reject */ =>
    zipper.create(options)
    .catch(err => log.error(err))
    .then(resolve)
  )

export default epub
