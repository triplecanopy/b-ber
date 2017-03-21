
/**
 * @module pdf
 */

import path from 'path'
import fs from 'fs-extra'
import YAML from 'yamljs'
import html2pdf from 'html-pdf'
import Printer from 'modifiers/printer'
import { log } from 'plugins'
import { src, dist, build } from 'utils'

let input, output, buildType, printer, settings
const initialize = () => {
  input = src()
  output = dist()
  buildType = build()
  printer = new Printer(output)
  settings = {
    fname: `${new Date().toISOString().replace(/:/g, '-')}.pdf`,
    options: {
      height: '198mm',
      width: '130mm',
      orientation: 'portrait',
      border: {
        left: '7mm',
        top: '7mm',
        bottom: '10mm',
        right: '7mm'
      },
      header: {
        height: '14mm',
        contents: '<div style="text-align: center; font-family:Helvetica; font-size:12px; color: lightgrey;">Made with bber</div>' // eslint-disable-line max-len
      },
      footer: {
        height: '5mm',
        default: '<span>{{page}}</span>/<span>{{pages}}</span>'
      },
      base: `file://${output}/OPS/Text/`,
      timeout: 10000
    }
  }
}

const parseHTML = files =>
  new Promise((resolve, reject) => {
    const dir = path.join(output, 'OPS/text')
    const text = files.map((_, index, arr) => {
      let data
      try {
        data = fs.readFileSync(path.join(dir, _), 'utf8')
      } catch (err) {
        return log.warn(err.message)
      }
      return printer.parse(data, index, arr)
    }).filter(Boolean)

    Promise.all(text)
    .catch(err => reject(err))
    .then(docs => resolve(docs.join('\n')))
  })

// const write = content =>
//   new Promise((resolve, reject) =>
//     fs.writeFile(path.join(output, 'pdf.xhtml'), content, (err) => {
//       if (err) { reject(err) }
//       resolve(content)
//     })
//   )

const print = content =>
  new Promise((resolve/* , reject */) => {
    log.info(`Creating PDF: ${settings.fname}`)
    html2pdf
    .create(content, settings.options)
    .toFile(path.join(process.cwd(), settings.fname), (err) => {
      if (err) { throw err }
      resolve()
    })
  })


const pdf = () =>
  new Promise(async (resolve/* , reject */) => {
    await initialize()
    const manifest = YAML.load(path.join(input, `${buildType}.yml`))

    parseHTML(manifest)
    // not necessary to write the file, but could be nice to have the document as XHTML
    // .then(content => write(content))
    .then(content => print(content))
    .catch(err => log.error(err))
    .then(resolve)
  })

export default pdf
