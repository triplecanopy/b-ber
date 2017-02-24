
// TODO: make task for this, run from CLI with ./node_modules/.bin/babel-node ./lib/pdf.jsx --presets es2015,stage-0

import path from 'path'
import html2pdf from 'html-pdf'
import fs from 'fs-extra'
import conf from '../config'
import Printer from '../modules/printer'
// import { log } from '../log'

const cwd = process.cwd()

// const htmlPath = path.join(cwd, conf.dist, 'OPS/Text/content-2.xhtml')
// const html = fs.readFileSync(htmlPath, 'utf8')
// const options = {
//   height: '198mm',
//   width: '130mm',
//   orientation: 'portrait',
//   border: {
//     left: '7mm',
//     top: '7mm',
//     bottom: '10mm',
//     right: '7mm'
//   },
//   header: {
//     height: '14mm',
//     contents: '<div style="text-align: center; font-family:Helvetica; font-size:12px; color: lightgrey;">Made with bber</div>' // eslint-disable-line max-len
//   },
//   footer: {
//     height: '5mm',
//     default: '<span>{{page}}</span>/<span>{{pages}}</span>'
//   }
//   // base: `file://${path.join(cwd, conf.dist, 'OPS/Text')}`
// }

const printer = new Printer()

const parseHTML = files =>
  new Promise((resolve/* , reject */) => {
    const dir = path.join(cwd, 'book-epub', 'OPS/text')
    const text = files.map((_, index, arr) => {
      let data
      try {
        data = fs.readFileSync(path.join(dir, _), 'utf8')
      } catch (err) {
        return console.log(err.message)
        // return log.warn(err.message)
      }
      return printer.parse(data, index, arr)
    }).filter(Boolean)
    Promise.all(text).then(docs => resolve(docs.join('\n')))
  })

const pdf = () => {
  // new Promise((resolve, reject) =>

  // remove book-pdf dir
  // create book-pdf dir

  fs.readdir(path.join(cwd, 'book-epub/OPS/text'), (err, files) => {
    if (err) { throw err }
    parseHTML(files).then(_ =>
      // write file to book-pdf dir
      // init html-pdf for file
      // write file to ./
    )
  })

    // html2pdf.create(html, options).toFile('./output.pdf', (err, data) => {
    //   if (err) { reject(err) }
    //   resolve()
    // })

  // )
}

pdf()
// export default pdf
