
/* eslint-disable operator-linebreak */

import renderLayouts from 'layouts'
import path from 'path'
import fs from 'fs-extra'
import File from 'vinyl'
import rrdir from 'recursive-readdir'
import YAML from 'yamljs'
import { find, findIndex } from 'underscore'

import conf from './config'
import { log } from './log'
import * as tmpl from './templates'
import { topdir, cjoin, getFrontmatter, orderByFileName } from './utils'

const cwd = process.cwd()
const navdocs = ['toc.ncx', 'toc.xhtml']

let bookmeta

const loadmeta = () =>
  new Promise(resolve/* , reject */ =>
    YAML.load(path.join(cwd, conf.src, 'metadata.yml'), (resp) => {
      bookmeta = resp
      resolve()
    })
  )

const parse = arr =>
  arr.map(file => ({
    location: path.basename(file).split('_')[1]
      ? path.basename(file).split('_')[1].split('-')
      : null,
    fullpath: file,
    toppath: topdir(file),
    name: path.basename(file),
    extension: path.extname(file)
  }))

const orderByPagesYAML = filearr => {
  return YAML.load(path.join(cwd, conf.src, 'pages.yml'), (resp) => {
    resp.forEach((_) => {
      const index = findIndex(filearr, item => console.log(_, item.name))
      // console.log(index)
      // if (index > -1) {

      // }
    })
  })
}

const add = (file, arr) => {
  if (!file.location || file.location.length < 1) {
    return navdocs.indexOf(file.name) === -1
      ? log.warn(`Section number does not exist for ${file.name}`)
      : ''
  }

  const current = Number(file.location)
  const context = Number(file.location.shift())
  const parent = find(arr, _ => Number(_.section) === context)

  if (!parent) {
    arr.push({
      section: current,
      filename: file.name,
      title: getFrontmatter(file, 'section_title'),
      children: []
    })
  } else {
    add(file, parent.children)
  }

  return arr
}

const makenav = ({ serial, parallel }) =>
  new Promise((resolve, reject) => {
    const nav = []
    serial.map(_ => add(_, nav, reject))
    resolve({ nav, filearrs: serial.concat(parallel) })
  })

const manifest = () =>
  new Promise((resolve, reject) =>
    rrdir(`${conf.dist}/OPS`, async (err, filearr) => {
      if (err) { reject(err) }

      const files = filearr.filter(_ => path.basename(_).charAt(0) !== '.')
      const serial = await orderByFileName(await parse(files.filter(_ => path.extname(_) === '.xhtml')))

      // orderByPagesYAML(serial)

      const parallel = await parse(files.filter(_ => path.extname(_) !== '.xhtml'))

      resolve({ serial, parallel })
    })
  )

const stringify = files =>
  new Promise(async (resolve /* , reject */) => {
    const strings = { manifest: [], spine: [], guide: [], bookmeta: [] }
    strings.bookmeta = bookmeta.map(_ => tmpl.metatag(_)).filter(Boolean)

    // going to be a couple more exceptions here, should drop these into `templates.jsx`
    strings.bookmeta = [
      ...strings.bookmeta,
      '<meta property="ibooks:specified-fonts">true</meta>',
      `<meta property="dcterms:modified">${new Date().toISOString().replace(/\.\d{3}Z$/, 'Z')}</meta>`
    ]

    files.forEach((file, idx) => {
      strings.manifest.push(tmpl.item(file))
      strings.spine.push(tmpl.itemref(file))
      strings.guide.push(tmpl.reference(file))
      if (idx === files.length - 1) { resolve(strings) }
    })
  })

const writeopf = string =>
  new Promise((resolve, reject) => {
    fs.writeFile(
      path.join(cwd, conf.dist, 'OPS', 'content.opf'), string, (err) => {
        if (err) { reject(err) }
        resolve()
      }
    )
  })

function opflayouts(strings) {
  return renderLayouts(new File({
    path: './.tmp',
    layout: 'opfPackage',
    contents: new Buffer([
      renderLayouts(new File({
        path: './.tmp',
        layout: 'opfMetadata',
        contents: new Buffer(strings.bookmeta.join(''))
      }), tmpl).contents.toString(),
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

const navlayouts = ({ nav, filearrs }) => {
  const navpoints = tmpl.navPoint(nav)
  const tocitems = tmpl.tocitem(nav)
  const ncxstring = renderLayouts(new File({
    path: './.tmp',
    layout: 'ncxTmpl',
    contents: new Buffer(navpoints)
  }), tmpl)
  .contents
  .toString()

  const tocstring = renderLayouts(new File({
    path: './.tmp',
    layout: 'tocTmpl',
    contents: new Buffer(tocitems)
  }), tmpl)
  .contents
  .toString()

  return { ncxstring, tocstring, filearrs }
}

const writenav = ({ ncxstring, tocstring, filearrs }) =>
  new Promise((resolve, reject) => {
    fs.writeFile(
      path.join(cwd, conf.dist, 'OPS', 'toc.ncx'), ncxstring, (err1) => {
        if (err1) { reject(err1) }
        fs.writeFile(
          path.join(cwd, conf.dist, 'OPS', 'toc.xhtml'), tocstring, (err2) => {
            if (err2) { reject(err2) }
            resolve(filearrs)
          }
        )
      }
    )
  })

const clearnav = () =>
  new Promise((resolve, reject) =>
    navdocs.forEach((file, idx) =>
      fs.remove(
        path.join(cwd, conf.dist, 'OPS', file), (err1) => {
          if (err1) { reject(err1) }
          return fs.writeFile(
            path.join(cwd, conf.dist, 'OPS', file), '', (err2) => {
              if (err2) { reject(err2) }
              if (idx === navdocs.length - 1) { resolve() }
            }
          )
        }
      )
    )
  )

const rendernav = data =>
  new Promise(async resolve/* , reject */ =>
    resolve(await navlayouts(data)))

const renderopf = strings =>
  new Promise(async resolve/* , reject */ =>
    resolve(await opflayouts(strings)))

const opf = () =>
  new Promise(resolve/* , reject */ =>
    loadmeta()
    .then(clearnav)
    .then(manifest)
    .then(filearrs => makenav(filearrs))
    .then(response => rendernav(response))
    .then(response => writenav(response))
    .then(filearr => stringify(filearr))
    .then(strings => renderopf(strings))
    .then(opfdata => writeopf(opfdata))
    .catch(err => log.error(err))
    .then(resolve)
  )

export default opf
