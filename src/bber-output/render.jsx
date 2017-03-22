
/**
 * @module render
 */

// TODO: this should be cleaned up to use promise chain

import renderLayouts from 'layouts'
import path from 'path'
import fs from 'fs-extra'
import File from 'vinyl'
import MarkIt from 'bber-plugins/md'
import { pageHead, pageBody, pageTail } from 'bber-templates/pages'
import { src, dist } from 'bber-utils'

let input
let output
let mdDir
let textDir

const initialize = () => {
  input = src()
  output = dist()
  mdDir = path.join(`${input}/_markdown/`)
  textDir = path.join(`${output}/OPS/text/`)
}

// write files to `textDir` dir
const write = (fname, markup, idx, len, rs, rj) =>
  fs.writeFile(path.join(textDir, `${fname}.xhtml`), markup, (err) => {
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
    if (fs.statSync(textDir)) {
      write(fname, markup, idx, len, rs, rj)
    }
  } catch (e) {
    fs.mkdirs(textDir, () => write(fname, markup, idx, len, rs, rj))
  }
}

// compile md to XHTML
const parse = (fname, data, idx, len, rs, rj) =>
  layout(fname, MarkIt.render(fname, data), idx, len, rs, rj)

async function render() {
  await initialize()
  return new Promise(async (resolve, reject) =>
    fs.readdir(mdDir, async (err1, files) => {
      if (err1) { reject(err1) }
      const len = files.length - 1
      return files.forEach((file, idx) => {
        if (file.charAt(0) === '.') { return }
        fs.readFile(path.join(mdDir, file), 'utf8', (err2, data) => {
          if (err2) { reject(err2) }
          return parse(path.basename(file, '.md'), data, idx, len, resolve, reject)
        })
      })
    })
  )
}

export default render
