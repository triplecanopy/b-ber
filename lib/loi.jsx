
import fs from 'fs-extra'
import path from 'path'
import renderLayouts from 'layouts'
import File from 'vinyl'
import log from './log'
import conf from './config'
import store from './store'
import { updateStore } from './utils'
import { page, image, loiLeader } from './templates'

const cwd = process.cwd()

const createLOILeader = () =>
  new Promise((resolve, reject) => {
    const filename = 'loi-0000'
    const markup = renderLayouts(new File({
      path: './.tmp',
      layout: 'page',
      contents: new Buffer(loiLeader())
    }), { page }).contents.toString()
    fs.writeFile(path.join(cwd, `${conf.dist}/OPS/text/${filename}.xhtml`), markup, 'utf8', (err) => {
      if (err) { reject(err) }
      updateStore('pages', {
        filename,
        section_title: 'List of Illustrations',
        landmark_type: 'loi',
        landmark_title: 'List of Illustrations'
      })
      resolve()
    })
  })

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
  new Promise((resolve/* , reject */) => {
    if (store.images.length) {
      createLOILeader()
      .then(createLOI)
      .catch(err => log.error(err))
      .then(resolve)
    } else { resolve() }
  })

export default loi
