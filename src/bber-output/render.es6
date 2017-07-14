/**
 * @module render
 */

// TODO: this should be cleaned up

import Promise from 'zousan'
import renderLayouts from 'layouts'
import path from 'path'
import fs from 'fs-extra'
import File from 'vinyl'
import MarkIt from 'bber-plugins/md'
import { pageHead, pageBody, pageTail } from 'bber-templates/pages'
import { src, dist } from 'bber-utils'
import { log } from 'bber-plugins'

// write files to `textDir` dir
const write = (fname, markup, idx, len, rs) => {
  const textDir = path.join(`${dist()}/OPS/text/`)
  fs.writeFile(path.join(textDir, `${fname}.xhtml`), markup, (err) => {
    log.info(`bber-output/render: Wrote XHTML: [${path.basename(fname)}.xhtml]`)
    if (err) { throw err }
    if (idx === len) { rs() }
  })
}

// insert compiled XHTML into layouts
const layout = (fname, data, idx, len, rs) => {
  const textDir = path.join(`${dist()}/OPS/text/`)
  const head = pageHead(fname)
  const tail = pageTail(fname)
  const markup = renderLayouts(new File({
    path: './.tmp',
    layout: 'pageBody',
    contents: new Buffer(`${head}${data}${tail}`),
  }), { pageBody }).contents.toString()


  if (fs.existsSync(textDir)) {
    write(fname, markup, idx, len, rs)
  } else {
    fs.mkdirs(textDir, () => write(fname, markup, idx, len, rs))
  }
}

// compile md to XHTML
const parse = (fname, data, idx, len, rs) =>
  layout(fname, MarkIt.render(fname, data), idx, len, rs)

function render() {
  const mdDir = path.join(`${src()}/_markdown/`)
  return new Promise(resolve =>
    fs.readdir(mdDir, (err1, files) => {
      if (err1) { throw err1 }
      const len = files.length - 1
      return files.forEach((file, idx) => {
        if (file.charAt(0) === '.') { return }

        log.info(`bber-output/render: Rendering Markdown: [${path.basename(file)}]`)
        fs.readFile(path.join(mdDir, file), 'utf8', (err2, data) => {
          if (err2) { throw err2 }
          return parse(path.basename(file, '.md'), data, idx, len, resolve)
        })
      })
    })
  )
}

export default render
