
/**
 * Export XHTML in the epub output directory as a single XML document
 * @module xml
 */

import path from 'path'
import fs from 'fs-extra'
import { parseString } from 'xml2js'
import { log } from 'plugins'
import { Parser } from 'modifiers'
import { dist } from 'utils'

const cwd = process.cwd()

// TODO: args here should be passed via CLI to support `const parser = new
// Parser(['chapter-three'])`
const parser = new Parser()

const readSpine = () =>
  new Promise((resolve, reject) => {
    const opf = path.join(cwd, dist(), 'OPS/content.opf')
    return fs.readFile(opf, 'utf8', (err1, data) => {
      if (err1) { reject(err1) }
      parseString(data, (err2, result) => {
        if (err2) { reject(err2) }
        const items = result.package.spine[0].itemref
        const files = items.map(_ => _.$.idref.slice(1))
        resolve(files)
      })
    })
  })

const parseHTML = files =>
  new Promise((resolve/* , reject */) => {
    const dir = path.join(cwd, dist(), 'OPS/text')
    const text = files.map((_, index, arr) => {
      let data
      try {
        data = fs.readFileSync(path.join(dir, _), 'utf8')
      } catch (err) {
        return log.warn(err.message)
      }
      return parser.parse(data, index, arr)
    }).filter(Boolean)
    Promise.all(text).then(docs => resolve(docs.join('\n')))
  })

const writeXML = str =>
  new Promise((resolve/* , reject */) => {
    const fpath = path.join(cwd, 'Export.xml') // -${new Date().toISOString().replace(/:/g, '-')}.xml`)
    fs.writeFile(fpath, str, 'utf8', (err) => {
      if (err) { throw err }
      resolve()
    })
  })

const xml = () =>
  new Promise(resolve/* , reject */ =>
    readSpine()
      .then(files => parseHTML(files))
      .then(markup => writeXML(markup))
      .catch(err => log.error(err))
      .then(resolve)
  )

export default xml
