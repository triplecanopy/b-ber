
import path from 'path'
import fs from 'fs-extra'
import { parseString } from 'xml2js'
import { log } from './log'
import conf from './config'
import Sanitizer from './sanitizer'

const cwd = process.cwd()
const sanitizer = new Sanitizer(['chapter-three']) // TODO: args here should be passed via CLI

const readSpine = () =>
  new Promise((resolve, reject) => {
    const opf = path.join(cwd, conf.dist, 'OPS/content.opf')
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
  new Promise((resolve, reject) => {
    const dir = path.join(cwd, conf.dist, 'OPS/text')
    const text = files.map((_) => {
      let data
      try {
        data = fs.readFileSync(path.join(dir, _), 'utf8')
      } catch (err) {
        return log.warn(err.message)
      }
      return sanitizer.parse(data)
    }).filter(Boolean)
    Promise.all(text).then(docs => resolve(docs.join('\n')))
  })

const writeXML = str =>
  new Promise((resolve, reject) => {
    const data = `<body>${str}</body>`
    const fpath = path.join(cwd, `Export.xml`)//-${new Date().toISOString().replace(/:/g, '-')}.xml`)
    fs.writeFile(fpath, data, 'utf8', (err) => {
      if (err) { throw err }
      resolve()
    })
  })

const xml = () =>
  new Promise((resolve, reject) =>
    readSpine()
      .then(files => parseHTML(files))
      .then(markup => writeXML(markup))
      .catch(err => log.error(err))
      .then(resolve)
  )

export default xml
