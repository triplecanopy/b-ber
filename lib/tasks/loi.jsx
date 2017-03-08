
/**
 * @module loi
 */

import fs from 'fs-extra'
import path from 'path'
import renderLayouts from 'layouts'
import File from 'vinyl'
import { log } from '../log'
import store from '../state/store'
import { updateStore, dist, build } from '../utils'
import { page, figure, loiLeader } from '../templates'

let output, buildEnv
const initialize = () => {
  output = dist()
  buildEnv = build()
}

const createLOILeader = () =>
  new Promise((resolve, reject) => {
    const filename = 'loi-0000'
    const markup = renderLayouts(new File({
      path: './.tmp',
      layout: 'page',
      contents: new Buffer(loiLeader())
    }), { page }).contents.toString()
    fs.writeFile(path.join(`${output}/OPS/text/${filename}.xhtml`), markup, 'utf8', (err) => {
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
      // Create image string based on dimensions of image, returns square |
      // landscape | portrait | portraitLong
      const imageStr = figure(data, buildEnv)
      const markup = renderLayouts(new File({
        path: './.tmp',
        layout: 'page',
        contents: new Buffer(imageStr)
      }), { page }).contents.toString()
      fs.writeFile(path.join(`${output}/OPS/text`, data.page), markup, 'utf8', (err) => {
        if (err) { reject(err) }
        if (idx === store.images.length - 1) { resolve() }
      })
    })
  })

const loi = () =>
  new Promise(async (resolve/* , reject */) => {
    if (store.images.length) {
      await initialize()
      createLOILeader()
      .then(createLOI)
      .catch(err => log.error(err))
      .then(resolve)
    } else {
      resolve()
    }
  })

export default loi
