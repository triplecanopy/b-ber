
import renderLayouts from 'layouts'
import path from 'path'
import fs from 'fs-extra'
import File from 'vinyl'
import rrdir from 'recursive-readdir'
import { find } from 'lodash'

import conf from './config'
import * as tmpl from './templates'
import { topdir, cjoin } from './utils'

async function parse(arr) {
  const result = []
  arr.forEach((file, idx) => {
    const locationArr = path.basename(file).split('_')[1]
    let location = null
    if (locationArr) { location = locationArr.split('-') }
    result[idx] = {
      location,
      fullpath: file,
      toppath: topdir(file),
      name: path.basename(file),
      extension: path.extname(file)
    }
  })
  return result
}

async function order(filearr) {
  return filearr.sort(async (a, b) => {
    // name: '0070_5_name.xhtml'
    // order_section_[file name]

    const arrA = a.name.split('_')
    const seqA = arrA[0]

    const arrB = b.name.split('_')
    const seqB = arrB[0]

    return seqA < seqB ? -1 : seqA > seqB ? 1 : 0 // eslint-disable-line no-nested-ternary
  })
}

// const depth = 1
const add = (file, arr, callback) => {
  if (!file.location || file.location.length < 1) {
    callback(`Section number does not exist for ${file}`)
  }

  const current = Number(file.location)
  const context = Number(file.location.shift())
  const parent = find(arr, _ => Number(_.section) === Number(context))

  if (!parent) {
    arr.push({
      section: current,
      filename: file.name,
      title: path.basename(file.name, '.xhtml'),
      children: []
    })
  } else {
    add(file, parent.children)
  }

  return arr
}


const makenav = ({ serial, parallel }) =>
  new Promise((resolve, reject) => {
    // nav = [{
    //   section: 1,
    //   filename: 'file1.xhtml',
    //   title: 'Chapter One',
    //   children: [{
    //     section: 1,
    //     filename: 'file2.xhtml',
    //     title: 'Chapter One-One',
    //     children: []
    //   }, {
    //     section: 2,
    //     filename: 'file3.xhtml',
    //     title: 'Chapter One-Two',
    //     children: []
    //   }]
    // }, {
    //   section: 2,
    //   filename: 'file4.xhtml',
    //   title: 'Chapter Two',
    //   children: [{
    //     children: []
    //   }]
    // }]

    const nav = []
    serial.map(_ => add(_, nav, reject))
    resolve(serial.concat(parallel))
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
    .then(filearrs => makenav(filearrs))
    .then(filearr => stringify(filearr))
    .then(strings => render(strings))
    .then(opfdata => write(opfdata))
    .catch(err => reject(err))
    .then(resolve)
  )

export default opf
