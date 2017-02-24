
import zipper from 'mobi-zipper'
import path from 'path'
import { log } from '../log'
import { dist } from '../utils'

const options = () => ({
  input: path.join(dist(), 'OPS/content.opf'),
  output: process.cwd(),
  clean: true
})

const mobi = () =>
  new Promise(async resolve/* , reject */ =>
    zipper.create(await options())
    .catch(err => log.error(err))
    .then(resolve)
  )

export default mobi
