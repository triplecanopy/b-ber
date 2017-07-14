/* eslint-disable class-methods-use-this, consistent-return */
/**
 * @module create
 */

import Promise from 'zousan'
import fs from 'fs-extra'
import path from 'path'
import { log } from 'bber-plugins'
import { containerXML, mimetype } from 'bber-templates'
import { src, dist } from 'bber-utils'

const cwd = process.cwd()

class Container {
  get src() {
    return src()
  }
  get dist() {
    return dist()
  }
  get dirs() {
    return [
      `${this.dist}/OPS`,
      `${this.dist}/META-INF`,
    ]
  }

  /**
   * @constructor
   */
  constructor() {
    this.testParams = Container.prototype.constructor.testParams.bind(this)
    this.init = this.init.bind(this)
  }

  write() {
    return new Promise((resolve) => {
      const files = [
        { path: 'META-INF/container.xml', content: containerXML },
        { path: 'mimetype', content: mimetype },
      ]
      return files.forEach((_, i) =>
        fs.writeFile(path.join(this.dist, _.path), _.content, (err) => {
          if (err) { throw err }
          log.info(`bber-output/container: Wrote [${_.path}]`)
          if (i === files.length - 1) {
            resolve()
          }
        })
      )
    })
  }

  makedirs() {
    return new Promise(resolve =>
      this.dirs.map((dir, index) =>
        fs.mkdirs(dir, (err) => {
          if (err) { throw err }
          log.info(`bber-output/container: Created directory [${dir}]`)
          if (index === this.dirs.length - 1) {
            resolve()
          }
        })
      )
    )
  }

  static testParams(_input, _output, callback) {
    if (!_input || !_output) {
      throw new Error('[Create#testParams] requires both [input] and [output] parameters')
    }

    const input = path.resolve(cwd, _input)
    const output = path.resolve(cwd, _output)

    try {
      if (!fs.existsSync(input)) {
        throw new Error(`
          Cannot resolve input path: [${input}].
          Run [bber init] to start a new project`
        )
      }
    } catch (err) {
      log.error(err)
      process.exit(0)
    }

    return fs.mkdirs(output, (err) => {
      if (err) { throw err }
      return callback()
    })
  }

  init() {
    return new Promise(resolve =>
      this.testParams(this.src, this.dist, () =>
        this.makedirs()
        .then(() => this.write())
        .catch(err => log.error(err))
        .then(resolve)
      )
    )
  }
}

const container = new Container()
export default container.init
