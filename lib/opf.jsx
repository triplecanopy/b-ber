
import renderLayouts from 'layouts'
import path from 'path'
import fs from 'fs-extra'
import File from 'vinyl'
import rrdir from 'recursive-readdir'

import conf from './config'
import * as tmpl from './templates'
import { topdir, cjoin } from './utils'

const manifest = () =>
  new Promise((resolve, reject) =>
    rrdir(`${conf.dist}/OPS`, (err, files) => {
      if (err) { reject(err) }
      const filearr = files.filter(_ => path.basename(_).charAt(0) !== '.')
      filearr.forEach((file, idx) => {
        filearr[idx] = {
          fullpath: file,
          toppath: topdir(file),
          name: path.basename(file)
        }
        if (idx === filearr.length - 1) {
          resolve(filearr)
        }
      })
    })
  )

const stringify = files =>
  new Promise((resolve /* , reject */) => {
    const strings = { manifest: [], spine: [], guide: [] }
    files.forEach((file, idx) => {
      strings.manifest.push(tmpl.item(file))
      strings.spine.push(tmpl.itemref(file))
      strings.guide.push(tmpl.reference(file))
      if (idx === files.length - 1) { resolve(strings) }
    })
  })

const write = string =>
  new Promise((resolve, reject) => {
    fs.writeFile(
      path.join(
        __dirname, '../',
        conf.dist,
        'OPS/',
        'content.opf'
      ), string, (err) => {
        if (err) { reject(err) }
        resolve()
      })
  })

function dolayouts(strings) {
  return renderLayouts(new File({
    path: './.tmp',
    layout: 'opfPackage',
    contents: new Buffer([
      renderLayouts(new File({
        path: './.tmp',
        layout: 'opfManifest',
        contents: new Buffer(cjoin(strings.manifest))
      }), tmpl).contents.toString(),
      renderLayouts(new File({
        path: './.tmp',
        layout: 'opfSpine',
        contents: new Buffer(cjoin(strings.spine))
      }), tmpl).contents.toString(),
      renderLayouts(new File({
        path: './.tmp',
        layout: 'opfGuide',
        contents: new Buffer(cjoin(strings.guide))
      }), tmpl).contents.toString()
    ].join('\n'))
  }), tmpl)
  .contents
  .toString()
}

const render = strings =>
  new Promise(async resolve/* , reject */ =>
    resolve(await dolayouts(strings)))

const opf = () =>
  new Promise((resolve, reject) =>
    manifest()
    .then(files => stringify(files))
    .then(strings => render(strings))
    .then(opfdata => write(opfdata))
    .catch(err => reject(err))
    .then(resolve)
  )

export default opf
