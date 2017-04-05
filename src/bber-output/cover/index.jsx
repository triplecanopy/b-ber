import fs from 'fs-extra'
import path from 'path'
import YAML from 'yamljs'
import { find } from 'lodash'
import childProcess from 'child_process'
import phantomjs from 'phantomjs-prebuilt'
import { log } from 'bber-plugins'
import store from 'bber-lib/store'
import { entries, src, version, guid, rpad, hrtimeformat } from 'bber-utils'

let seq
let diff

class Cover {
  constructor() {
    this.metadata = {
      title: '',
      creator: '',
      // 'date-modified': '',
      identifier: '',
      bberVersion: ''
    }
    this.coverPrefix = '__bber_cover__'
    this.args = [path.join(__dirname, 'phantomjs.js')]
  }

  removeDefaultCovers() {
    return new Promise((resolve, reject) => {
      const imageDir = path.join(src(), '_images')
      return fs.readdir(imageDir, (err0, files) => {
        if (err0) {
          throw err0
        }
        const oldCovers = files.filter(_ => path.basename(_).match(new RegExp(this.coverPrefix)))
        if (!oldCovers.length) { return resolve() }
        return oldCovers.forEach(_ =>
          fs.remove(path.join(imageDir, _), (err1) => {
            if (err1) { reject(err1) }
            return resolve()
          })
        )
      })
    })
  }

  create() {
    seq = process.hrtime()
    const fileName = `${this.coverPrefix}${guid()}.jpg`
    const outFile = path.join(src(), '_images', fileName)
    let data

    try {
      data = YAML.load(path.join(src(), 'metadata.yml'))
    } catch (err) {
      log.error(err)
      process.exit(1)
    }

    if (find(data, { term: 'cover' }) !== undefined) {
      return Promise.resolve()
    }

    for (const [k] of entries(this.metadata)) {
      const meta = find(data, { term: k })
      if (meta) {
        this.metadata[k] = meta.value
      }
    }

    this.metadata.bberVersion = version()
    this.metadata['date-modified'] = new Date()

    store.bber.metadata.push({ term: 'cover', value: fileName })

    let content = '<html><body>'
    content += `<h1>${this.metadata.title}</h1>`
    content += `<p><span>Creator</span>${this.metadata.creator}</p>`
    content += `<p><span>Date Modified</span>${this.metadata['date-modified']}</p>`
    content += `<p><span>Identifier</span>${this.metadata.identifier}</p>`
    content += `<p><span>b-ber version</span>${this.metadata.bberVersion}</p>`
    content += '</body></html>'

    this.args.push(content, outFile)
    return this.removeDefaultCovers().then(() => this.generate())
  }

  generate() {
    return new Promise(resolve /* , reject */ =>
      childProcess.execFile(phantomjs.path, this.args, (err, stdout, stderr) => {
        if (err) { console.error(err) }
        if (stderr) { console.error(stderr) }
        if (stdout) { console.log(stdout) }
        diff = process.hrtime(seq)
        log.info(`Resolved ${rpad('cover', ' ', 8)} ${hrtimeformat(diff)}`)
        return resolve()
      })
    )
  }
}

const cover = new Cover()
export default cover
