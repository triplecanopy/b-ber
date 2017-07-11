
/**
 * @module loi
 */

import Promise from 'zousan'
import fs from 'fs-extra'
import path from 'path'
import renderLayouts from 'layouts'
import File from 'vinyl'
import store from 'bber-lib/store'
import { log } from 'bber-plugins'
import { dist, build, modelFromString } from 'bber-utils'
import figure from 'bber-templates/figures'
import { page, loiLeader } from 'bber-templates/pages'

const createLOILeader = () =>
  new Promise((resolve) => {
    const filename = 'loi-0000'
    const markup = renderLayouts(new File({
      path: './.tmp',
      layout: 'page',
      contents: new Buffer(loiLeader()),
    }), { page }).contents.toString()
    fs.writeFile(path.join(dist(), `/OPS/text/${filename}.xhtml`), markup, 'utf8', (err) => {
      if (err) { throw err }
      // TODO: following be merged with `store.spine`, and `store.pages`
      // should be removed
      store.add('pages', {
        filename,
        title: 'Figures',
        type: 'loi',
      })

      resolve()
    })
  })

const createLOI = () =>
  new Promise((resolve) => {
    store.images.forEach((data, idx) => {
      // Create image string based on dimensions of image
      // returns square | landscape | portrait | portraitLong
      const imageStr = figure(data, build())
      const markup = renderLayouts(new File({
        path: './.tmp',
        layout: 'page',
        contents: new Buffer(imageStr),
      }), { page }).contents.toString()
      fs.writeFile(path.join(dist(), '/OPS/text', data.page), markup, 'utf8', (err) => {
        if (err) { throw err }

        const fileData = {
          ...modelFromString(data.page, store.config.src),
          inToc: false,
        }

        store.add('spine', fileData)

        if (idx === store.images.length - 1) { resolve() }
      })
    })
  })

const loi = () =>
  new Promise(async (resolve) => {
    if (store.images.length) {
      createLOILeader()
      .then(createLOI)
      .catch(err => log.error(err))
      .then(resolve)
    } else {
      resolve()
    }
  })

export default loi
