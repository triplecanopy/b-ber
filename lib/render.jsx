
import renderLayouts from 'layouts'
import path from 'path'
import fs from 'fs-extra'
import File from 'vinyl'

import conf from './config'
import md from './md'
import { page } from './templates'

const mddir = path.join(__dirname, `/../${conf.src}/_markdown/`)
const dest = path.join(__dirname, `/../${conf.dist}/OPS/text/`)

// write files to `dest` dir
const write = (fname, markup, idx, len, rs, rj) =>
  fs.writeFile(path.join(dest, `${fname}.xhtml`), markup, (err) => {
    if (err) { rj(err) }
    if (idx === len) { rs() }
  })

// insert compiled XHTML into layouts
const layout = (fname, data, idx, len, rs, rj) => {
  const markup = renderLayouts(new File({
    path: './.tmp',
    layout: 'page',
    contents: new Buffer(data)
  }), { page }).contents.toString()

  try {
    if (fs.statSync(dest)) {
      write(fname, markup, idx, len, rs, rj)
    }
  } catch (e) {
    fs.mkdirs(dest, () => write(fname, markup, idx, len, rs, rj))
  }
}

// compile md to XHTML
const parse = (fname, data, idx, len, rs, rj) =>
  layout(fname, md.render(data), idx, len, rs, rj)

const render = () =>
  new Promise((resolve, reject) => {
    fs.readdir(mddir, (err1, files) => {
      if (err1) { reject(new Error(err1)) }
      const len = files.length - 1
      return files.forEach((file, idx) => (
        fs.readFile(path.join(mddir, file), 'utf8', (err2, data) => {
          if (err2) { reject(new Error(err2)) }
          return parse(path.basename(file, '.md'), data, idx, len, resolve, reject)
        })
      ))
    })
  })

export default render
