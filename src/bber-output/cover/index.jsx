import fs from 'fs-extra'
import path from 'path'
import YAML from 'yamljs'
import { find } from 'lodash'
import phantomjs from 'phantomjs-prebuilt'
import childProcess from 'child_process'
import { entries, src, version } from 'bber-utils'
import { log } from 'bber-plugins'

class Cover {
  constructor() {
    this.metadata = {
      title: '',
      creator: '',
      // 'date-modified': '',
      identifier: '',
      bberVersion: ''
    }
    this.args = [path.join(__dirname, 'phantomjs.js')]
  }
  write() {
    let data
    let coverImage
    let outFile

    try {
      data = YAML.load(path.join(src(), 'metadata.yml'))
    } catch (err) {
      log.error(err)
      process.exit(1)
    }

    try {
      if ((coverImage = find(data, { term: 'cover' }))) {
        try {
          outFile = path.join(src(), '_images', coverImage.value)
          if (!fs.existsSync(outFile)) {
            throw new Error(`ENOENT: [${outFile}] not found`)
          }
        } catch (err1) {
          log.error(err1)
          process.exit(1)
        }
      }
    } catch (err0) {
      log.error(err0)
      process.exit(1)
    }

    for (const [k] of entries(this.metadata)) {
      const meta = find(data, { term: k })
      if (meta) {
        this.metadata[k] = meta.value
      }
    }

    this.metadata.bberVersion = version()
    this.metadata['date-modified'] = new Date()

    let content = '<html><body>'
    content = `<h1>${this.metadata.title}</h1>`
    content += `<p><span>Creator</span>${this.metadata.creator}</p>`
    content += `<p><span>Date Modified</span>${this.metadata['date-modified']}</p>`
    content += `<p><span>ID</span>${this.metadata.identifier}</p>`
    content += `<p><span>b-ber version</span>${this.metadata.bberVersion}</p>`
    content += '</body></html>'

    this.args.push(content)
    this.args.push(outFile)

    this.generate()
  }

  generate() {
    return new Promise(resolve /* , reject */ =>
      childProcess.execFile(phantomjs.path, this.args, (err, stdout, stderr) => {
        if (err) { console.error(err) }
        if (stderr) { console.error(stderr) }
        if (stdout) { console.log(stdout) }
        resolve()
      })
    )
  }
}

const cover = new Cover()
export default cover
