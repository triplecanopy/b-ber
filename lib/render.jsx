
import gulp from 'gulp'
import renderLayouts from 'layouts'
import path from 'path'
import fs from 'fs'
import mkdirp from 'mkdirp'
import File from 'vinyl'

import conf from './config'
import md from './md'

import { page } from './templates'

const mddir = path.join(__dirname, `/../${conf.src}/_markdown/`)
const dest = path.join(__dirname, `/../${conf.dist}/OPS/text/`)

// write files to `dest` dir
const write = (fname, markup, idx, len, done) =>
  fs.writeFile(path.join(dest, `${fname}.xhtml`), markup, (err) => {
    if (err) { throw err }
    if (idx === len) {
      done()
      console.log('render done')
    }
  })

// insert compiled XHTML into layouts
const layout = (fname, data, idx, len, done) => {
  const markup = renderLayouts(new File({
    path: './.tmp',
    layout: 'page',
    contents: new Buffer(data)
  }), { page }).contents.toString()

  try {
    if (fs.statSync(dest)) {
      write(fname, markup, idx, len, done)
    }
  } catch (e) {
    mkdirp(dest, () => write(fname, markup, idx, len, done))
  }
}

// compile md to XHTML
const render = (fname, data, idx, len, done) =>
  layout(fname, md.render(data), idx, len, done)

// get all markdown files
gulp.task('render', done =>
  fs.readdir(mddir, (err1, files) => {
    if (err1) { throw err1 }
    const len = files.length - 1
    return files.forEach((file, idx) => (
      fs.readFile(path.join(mddir, file), 'utf8', (err2, data) => {
        if (err2) { throw err2 }
        return render(path.basename(file, '.md'), data, idx, len, done)
      })
    ))
  })
)
