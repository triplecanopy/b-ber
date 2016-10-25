
import fs from 'fs-extra'
import conf from './config'
import { container, mimetype } from './templates'

const dest = `${conf.dist}/OPS`

const write = (resolve, reject) =>
  fs.writeFile(`${conf.dist}/container.xml`, container, (err1) => {
    if (err1) { reject(err1) }
    return fs.writeFile(`${conf.dist}/mimetype`, mimetype, (err2) => {
      if (err2) { reject(err2) }
      console.log('create done')
      resolve()
    })
  })

const create = () =>
  new Promise((resolve, reject) => {
    try {
      if (fs.statSync(dest)) {
        console.log('has dest')
        write(resolve, reject)
      }
    } catch (e) {
      fs.mkdirs(dest, (err) => {
        console.log('no dest')
        if (err) { reject(err) }
        write(resolve, reject)
      })
    }
  })

export default create
