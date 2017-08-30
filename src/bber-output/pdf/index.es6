
/**
 * @module pdf
 */

import Promise from 'zousan'
import path from 'path'
import fs from 'fs-extra'
import Yaml from 'bber-lib/yaml'
import html2pdf from 'html-pdf'
import Printer from 'bber-modifiers/printer'
import { log } from 'bber-plugins'
import { src, dist, build } from 'bber-utils'
import { isPlainObject, isArray } from 'lodash'

const writeOutput = false

let input
let output
let buildType
let printer
let settings

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
        right: '7mm',
      },
      header: {
        height: '14mm',
        contents: '<div style="text-align: center; font-family:Helvetica; font-size:12px; color: lightgrey;">Made with bber</div>', // eslint-disable-line max-len
      },
      footer: {
        height: '5mm',
        default: '<span>{{page}}</span>/<span>{{pages}}</span>',
      },
      base: `file://${output}/OPS/Text/`,
      timeout: 10000,
    },
  }
}

const parseHTML = files =>
  new Promise((resolve) => {
    const dirname = path.join(output, 'OPS/text')
    const text = files.map((_, index, arr) => {
      let data

      const fname = isPlainObject(_) ? Object.keys(_)[0] : typeof _ === 'string' ? _ : null
      const ext = '.xhtml'

      if (!fname) { return null }

      const fpath = path.join(dirname, `${fname}${ext}`)

      try {
        if (!fs.existsSync(fpath)) { return null }
        data = fs.readFileSync(fpath, 'utf8')
      } catch (err) {
        return log.warn(err.message)
      }
      return printer.parse(data, index, arr)
    }).filter(Boolean)

    console.log(text)
    Promise.all(text)
    .catch(err => log.error(err))
    .then(docs => resolve(docs.join('\n')))
  })

const write = (content) => {
  if (writeOutput !== true) { return Promise.resolve(content) }
  return new Promise(resolve =>
    fs.writeFile(path.join(output, 'pdf.xhtml'), content, (err) => {
      if (err) { throw err }
      resolve(content)
    })
  )
}

const print = content =>
  new Promise((resolve) => {
    log.info(`Creating PDF: ${settings.fname}`)
    html2pdf
    .create(content, settings.options)
    .toFile(path.join(process.cwd(), settings.fname), (err) => {
      if (err) { throw err }
      resolve()
    })
  })


const pdf = () =>
  new Promise(async (resolve) => {
    await initialize()
    const manifest = Yaml.load(path.join(input, `${buildType}.yml`))

    parseHTML(manifest)
    // TODO: pass `writeOutput` flag to determine if the task also outputs
    // XHTML version
    .then(content => write(content))
    .then(content => print(content))
    .catch(err => log.error(err))
    .then(resolve)
  })

export default pdf
