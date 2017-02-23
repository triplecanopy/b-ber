
import fs from 'fs-extra'
import { log } from '../log'
import { container, mimetype } from '../templates'
import { src, dist } from '../utils'

const input = src()
const output = dist()

const dirs = [
  `${output}/OPS`,
  `${output}/META-INF`
]

const write = () =>
  new Promise((resolve, reject) =>
    fs.writeFile(`${output}/META-INF/container.xml`, container, (err1) => {
      if (err1) { reject(err1) }
      fs.writeFile(`${output}/mimetype`, mimetype, (err2) => {
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
  new Promise((resolve, reject) => {
    try {
      if (fs.statSync(input)) {
        makedirs()
        .then(write)
        .catch(err => log.error(err))
        .then(resolve)
      }
    }
    catch (e) {
      reject(new Error(`${input} directory does not exist.`))
    }
  })

export default create
