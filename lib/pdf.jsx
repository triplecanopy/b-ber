
// TODO: make task for this, run from CLI with ./node_modules/.bin/babel-node ./lib/pdf.jsx --presets es2015,stage-0

import path from 'path'
import html2pdf from 'html-pdf'
import fs from 'fs-extra'
import conf from './config'
import { log } from './log'

const cwd = process.cwd()
const htmlPath = path.join(cwd, conf.dist, 'OPS/Text/content-2.xhtml')
const html = fs.readFileSync(htmlPath, 'utf8')
const options = {
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
  }
  // base: `file://${path.join(cwd, conf.dist, 'OPS/Text')}`
}

const pdf = () => {
  html2pdf.create(html, options).toFile('./output.pdf', (err, data) => {
    if (err) { throw err }
    log.info(`success! pdf is at ${data.filename}`)
  })
}

pdf()
// export default pdf
