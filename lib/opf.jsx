
/* eslint-disable operator-linebreak */

import renderLayouts from 'layouts'
import path from 'path'
import fs from 'fs-extra'
import File from 'vinyl'
import rrdir from 'recursive-readdir'
import YAML from 'yamljs'
import { find, findWhere } from 'underscore'

import conf from './config'
import logger from './logger'
import * as tmpl from './templates'
import { topdir, cjoin } from './utils'

const navdocs = ['toc.ncx', 'toc.xhtml']

let bookmeta, pagemeta

const loadmeta = () =>
  new Promise(resolve/* , reject */ =>
    YAML.load(path.join(__dirname, '../', conf.src, 'metadata.yml'), (resp1) => {
      bookmeta = resp1
      YAML.load(path.join(__dirname, '../', conf.src, 'pagemeta.yml'), (resp2) => {
        pagemeta = resp2
        resolve()
      })
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

const order = filearr =>
  filearr.sort((a, b) => {
    const seqA = a.name.split('_')[0]
    const seqB = b.name.split('_')[0]
    return seqA < seqB ? -1 : seqA > seqB ? 1 : 0 // eslint-disable-line no-nested-ternary
  })

const getTitle = (file) => {
  const fname = path.basename(file.name, '.xhtml')
  const found = findWhere(pagemeta, { filename: fname })
  return found && {}.hasOwnProperty.call(found, 'section_title') ? found.section_title : fname
}

const add = (file, arr) => {
  if (!file.location || file.location.length < 1) {
    return navdocs.indexOf(file.name) === -1
      ? logger.warn(`Section number does not exist for ${file.name}\n`)
      : ''
  }

  const current = Number(file.location)
  const context = Number(file.location.shift())
  const parent = find(arr, _ => Number(_.section) === context)

  if (!parent) {
    arr.push({
      section: current,
      filename: file.name,
      title: getTitle(file),
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
      const serial = await order(await parse(files.filter(_ => path.extname(_) === '.xhtml')))
      const parallel = await parse(files.filter(_ => path.extname(_) !== '.xhtml'))

      resolve({ serial, parallel })
    })
  )

const stringify = files =>
  new Promise(async (resolve /* , reject */) => {
    const strings = { manifest: [], spine: [], guide: [], pagemeta: [], bookmeta: [] }
    strings.bookmeta = bookmeta.map(_ => tmpl.metatag(_)).filter(Boolean)

    // going to be a couple more exceptions here, should drop these into `templates.jsx`
    strings.bookmeta.push(`<meta property="dcterms:modified">${new Date().toISOString().replace(/\.\d{3}Z$/, 'Z')}</meta>`) // eslint-disable-line max-len

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
      path.join(__dirname, '../', conf.dist, 'OPS', 'content.opf'), string, (err) => {
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
      path.join(__dirname, '../', conf.dist, 'OPS', 'toc.ncx'), ncxstring, (err1) => {
        if (err1) { reject(err1) }
        fs.writeFile(
          path.join(__dirname, '../', conf.dist, 'OPS', 'toc.xhtml'), tocstring, (err2) => {
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
        path.join(__dirname, '../', conf.dist, 'OPS', file), (err1) => {
          if (err1) { reject(err1) }
          return fs.writeFile(
            path.join(__dirname, '../', conf.dist, 'OPS', file), '', (err2) => {
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
    .catch(err => logger.error(err))
    .then(resolve)
  )

export default opf
