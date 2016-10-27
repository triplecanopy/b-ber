
import renderLayouts from 'layouts'
import path from 'path'
import fs from 'fs-extra'
import File from 'vinyl'
import rrdir from 'recursive-readdir'

import conf from './config'
import * as tmpl from './templates'
import { topdir, cjoin } from './utils'

const manifest = done =>
  rrdir(`${conf.dist}/OPS`, (err, files) => {
    if (err) { throw err }
    const filearr = files
    filearr.forEach((file, idx) => {
      filearr[idx] = {
        fullpath: file,
        toppath: topdir(file),
        name: path.basename(file)
      }
      if (idx === filearr.length - 1) {
        done(filearr)
        console.log('opf done')
      }
    })
  })

const stringify = (files, done) => {
  const strings = {
    manifest: [],
    spine: [],
    guide: []
  }
  files.forEach((file, idx) => {
    strings.manifest.push(tmpl.item(file))
    strings.spine.push(tmpl.itemref(file))
    strings.guide.push(tmpl.reference(file))
    if (idx === files.length - 1) {
      done(strings)
    }
  })
}

const write = (str, resolve, reject) =>
  fs.writeFile(path.join(__dirname, '../', conf.dist, 'OPS/', 'content.opf'), str, (err) => {
    if (err) { reject(err) }
    resolve()
  })

const render = (strings, resolve, reject) => {
  const opf = renderLayouts(new File({
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
  }), tmpl).contents.toString()

  write(opf, resolve, reject)
}

const opf = () =>
  new Promise((resolve, reject) =>
    manifest((files) => {
      const allfiles = []
      files.forEach((file, idx) => {
        allfiles.push(file)
        if (idx === files.length - 1) {
          return stringify(allfiles, strings =>
            render(strings, resolve, reject)
          )
        }
      })
    })
  )

export default opf
