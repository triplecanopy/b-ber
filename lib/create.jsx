
import fs from 'fs-extra'
import logger from './logger'
import conf from './config'
import { container, mimetype } from './templates'

const dirs = [
  `${conf.dist}/OPS`,
  `${conf.dist}/META-INF`
]

const write = () =>
  new Promise((resolve, reject) =>
    fs.writeFile(`${conf.dist}/META-INF/container.xml`, container, (err1) => {
      if (err1) { reject(err1) }
      fs.writeFile(`${conf.dist}/mimetype`, mimetype, (err2) => {
        if (err2) { reject(err2) }
        resolve()
      })
    })
  )

const makedirs = () =>
  new Promise((resolve, reject) =>
    dirs.map((dir, index) =>
      fs.mkdirs(dir, (err) => {
        if (err) { reject(err) }
        if (index === dirs.length - 1) { resolve() }
      })
    )
  )

const create = () =>
  new Promise(resolve/* , reject */ =>
    makedirs()
    .then(write)
    .catch(err => logger.error(new Error(err)))
    .then(resolve))

export default create
