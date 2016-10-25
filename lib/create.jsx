
import fs from 'fs'
import mkdirp from 'mkdirp'

import conf from './config'
import { container, mimetype } from './templates'

const dest = `${conf.dist}/OPS`

const write = () =>
  fs.writeFile(`${conf.dist}/container.xml`, container, (err1) => {
    if (err1) { throw err1 }
    return fs.writeFile(`${conf.dist}/mimetype`, mimetype, (err2) => {
      if (err2) { throw err2 }
      return console.log('create done')
    })
  })

const create = () => {
  try {
    if (fs.statSync(dest)) {
      console.log('has dest')
      return write()
    }
  } catch (e) {
    mkdirp(dest, (err) => {
      console.log('no dest')
      if (err) { throw err }
      return write()
    })
  }
}

export default create
