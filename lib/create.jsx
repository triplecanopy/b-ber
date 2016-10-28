
import fs from 'fs-extra'
import conf from './config'
import logger from './logger'
import { container, mimetype } from './templates'

const dirs = [
  `${conf.dist}/OPS`,
  `${conf.dist}/META-INF`
]

const write = (resolve, reject) => {
  console.log('writes')
  fs.writeFile(`${conf.dist}/META-INF/container.xml`, container, (err1) => {
    if (err1) { reject(err1) }
    return fs.writeFile(`${conf.dist}/mimetype`, mimetype, (err2) => {
      if (err2) { reject(err2) }
      logger.info('create done')
      resolve()
    })
  })
}

async function makedirs() {
  return new Promise((resolve, reject) =>
    dirs.map((dir, index) =>
      fs.mkdirs(dir, (err) => {
        console.log(index, dirs.length - 1)
        if (err) { reject(err) }
        if (index === dirs.length - 1) { resolve() }
      })
    )
  )
}

const create = () =>
  new Promise(async (resolve, reject) => {
    await makedirs().then(() => write(resolve, reject))
  })

export default create
