
import renderLayouts from 'layouts'
import path from 'path'
import fs from 'fs-extra'
import File from 'vinyl'

import conf from '../config'
import MarkIt from './md'
import { pageBody, pageHead, pageTail } from '../templates'

const cwd = process.cwd()

const mddir = path.join(cwd, `${conf.src}/_markdown/`)
const dest = path.join(cwd, `${conf.dist}/OPS/text/`)

// write files to `dest` dir
const write = (fname, markup, idx, len, rs, rj) =>
  fs.writeFile(path.join(dest, `${fname}.xhtml`), markup, (err) => {
    if (err) { rj(err) }
    if (idx === len) { rs() }
  })

// insert compiled XHTML into layouts
const layout = (fname, data, idx, len, rs, rj) => {
  const head = pageHead(fname)
  const tail = pageTail(fname)
  const markup = renderLayouts(new File({
    path: './.tmp',
    layout: 'pageBody',
    contents: new Buffer(`${head}${data}${tail}`)
  }), { pageBody }).contents.toString()

  try {
    if (fs.statSync(dest)) {
      write(fname, markup, idx, len, rs, rj)
    }
  }
  catch (e) {
    fs.mkdirs(dest, () => write(fname, markup, idx, len, rs, rj))
  }
}

// compile md to XHTML
const parse = (fname, data, idx, len, rs, rj) =>
  layout(fname, MarkIt.render(fname, data), idx, len, rs, rj)

const render = () =>
  new Promise((resolve, reject) => {
    fs.readdir(mddir, async (err1, files) => {
      if (err1) { reject(err1) }
      const len = files.length - 1
      return files.forEach((file, idx) => {
        if (file.charAt(0) === '.') { return }
        fs.readFile(path.join(mddir, file), 'utf8', (err2, data) => {
          if (err2) { reject(err2) }
          return parse(path.basename(file, '.md'), data, idx, len, resolve, reject)
        })
      })
    })
  })

export default render
