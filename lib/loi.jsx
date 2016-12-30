
import fs from 'fs-extra'
import path from 'path'
import renderLayouts from 'layouts'
import File from 'vinyl'
import log from './log'
import conf from './config'
import store from './store'
import { page, image } from './templates'

const cwd = process.cwd()

const createLOI = () =>
  new Promise((resolve, reject) => {
    store.images.forEach((data, idx) => {
      const imageStr = image(data)
      const markup = renderLayouts(new File({
        path: './.tmp',
        layout: 'page',
        contents: new Buffer(imageStr)
      }), { page }).contents.toString()
      fs.writeFile(path.join(cwd, `${conf.dist}/OPS/text`, data.page), markup, 'utf8', (err) => {
        if (err) { reject(err) }
        if (idx === store.images.length - 1) { resolve() }
      })
    })
  })

const loi = () =>
  new Promise(async (resolve/* , reject */) => {
    createLOI()
    .catch(err => log.error(err))
    .then(resolve)
  })

export default loi
