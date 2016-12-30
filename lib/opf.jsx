
/* eslint-disable operator-linebreak */

import renderLayouts from 'layouts'
import path from 'path'
import fs from 'fs-extra'
import File from 'vinyl'
import rrdir from 'recursive-readdir'
import YAML from 'yamljs'
import { find } from 'underscore'

import conf from './config'
import log from './log'
import * as tmpl from './templates'
import props from './props'
import { topdir, cjoin, getFrontmatter } from './utils'

const cwd = process.cwd()
const navdocs = ['toc.ncx', 'toc.xhtml']

let bookmeta

// load book's metdata for use later
const loadmeta = () =>
  new Promise(resolve/* , reject */ =>
    YAML.load(path.join(cwd, conf.src, 'metadata.yml'), (resp) => {
      bookmeta = resp
      resolve()
    })
  )

// break down the file name to extract hierarchy and order:
//
// @usage: <level 1>_<level 2>[_ ... level N ]
//
// @example:
// 0000_0000.xhtml: Section 0, Page 0
// 0000_0001.xhtml: Section 0, Page 1
//
// increment as needed:
// 0000_0000_0000.xhtml: Section 0, Sub-Section 0, Page 0
// 0000_0000_0000_0000.xhtml: Section 0, Sub-Section 0, Sub-Sub-Section 0, Page 0
//
const parse = arr =>
  arr.map((file) => {
    const children = []
    const position = path.basename(file, '.xhtml').split('_')
    const depth = position.length
    const fullpath = file
    const toppath = topdir(file)
    const filename = path.basename(file)
    const extension = path.extname(file)

    if (!props.isHTML({ fullpath })) { return null }
    if (navdocs.indexOf(filename) > -1) { return null }

    return { depth, position, fullpath, toppath, filename, extension, children }

  }).filter(Boolean)

// order pages
const order = filearr =>
  filearr.sort((a, b) => {
    const seqA = a.filename.split('_')[0]
    const seqB = b.filename.split('_')[0]
    return seqA < seqB ? -1 : seqA > seqB ? 1 : 0 // eslint-disable-line no-nested-ternary
  })

// push files into the root nav object, and recursively into their parent's
// `children` arrays if needed
//
const add = (file, arr) => {

  const { filename, position } = file

  const current = Number(position)
  const context = Number(position.shift())
  const parent = find(arr, _ => Number(_.section) === context)

  console.log(context)

  if (!parent) {
    arr.push({
      filename,
      title: getFrontmatter(file, 'section_title')
    })
  } else {
    add(file, parent.children)
  }

  // console.log(arr)
  return arr
}

// add file names to nav list, omit navigation documents (i.e., TOCs)
const makenav = ({ serial, parallel }) =>
  new Promise((resolve, reject) => {
    const nav = []
    serial.map(_ => add(_, nav, reject))
    resolve({ nav, filearrs: serial.concat(parallel) })
  })

// get opf manifest contents
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

//
const stringify = files =>
  new Promise(async (resolve /* , reject */) => {
    const strings = { manifest: [], spine: [], guide: [], bookmeta: [] }
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

// write!
const writeopf = string =>
  new Promise((resolve, reject) => {
    fs.writeFile(
      path.join(cwd, conf.dist, 'OPS', 'content.opf'), string, (err) => {
        if (err) { reject(err) }
        resolve()
      }
    )
  })

// render elemnts in the opf
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

// render the ncx and toc
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

// write!
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

//
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

// wait for nav to be rendered before writing
const rendernav = data =>
  new Promise(async resolve/* , reject */ =>
    resolve(await navlayouts(data)))

// wait for opf to be rendered before writing
const renderopf = strings =>
  new Promise(async resolve/* , reject */ =>
    resolve(await opflayouts(strings)))

// bootstrap
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
