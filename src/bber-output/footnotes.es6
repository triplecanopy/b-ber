/* eslint-disable class-methods-use-this */

/**
 * @module footnotes
 */

import Promise from 'zousan'
import fs from 'fs-extra'
import path from 'path'
import File from 'vinyl'
import renderLayouts from 'layouts'
import store from 'bber-lib/store'
import { log } from 'bber-plugins'
import { src, dist, modelFromString } from 'bber-utils'
import { isArray } from 'lodash'
import { page } from 'bber-templates/pages'

const cwd = process.cwd()

class Footnotes {
  get src() {
    return src()
  }
  get dist() {
    return dist()
  }
  get footnotes() {
    return store.footnotes
  }

  get fileName() {
    return 'notes'
  }
  get file() {
    return {
      name: this.fileName,
      path: path.join(this.dist, `/OPS/text/${this.fileName}.xhtml`),
    }
  }

  /**
   * @constructor
   */
  constructor() {
    this.init = this.init.bind(this)
  }

  writeFootnotes() {
    return new Promise((resolve) => {
      const notes = this.footnotes.reduce((acc, cur) => acc.concat(cur.notes), '')
      const markup = renderLayouts(new File({
        path: './.tmp',
        layout: 'page',
        contents: new Buffer(notes),
      }), { page }).contents.toString()

      fs.writeFile(this.file.path, markup, 'utf8', (err) => {
        if (err) { throw err }

        const fileData = {
          ...modelFromString(`${this.file.name}.xhtml`, store.config.src),
          in_toc: false,
          linear: false,
          generated: true,
        }

        store.add('spine', fileData)

        log.info(`bber-output/footnotes: Created default footnotes page [${this.file.name}.xhtml]`)

        resolve()
      })
    })
  }

  testParams(callback) {
    if (!this.src || !this.dist) {
      log.error(new Error(`bber-output/footnotes:
        [Footnotes#testParams] requires both [input] and [output] parameters`), 1)
    }

    const input = path.resolve(cwd, this.src)
    const output = path.resolve(cwd, this.dist)

    try {
      if (!fs.existsSync(input)) {
        throw new Error(`bber-output/footnotes:
          Cannot resolve input path: [${input}].
          Run [bber init] to start a new project`
        )
      }
    } catch (err) {
      log.error(err, 1)
    }

    if (!isArray(this.footnotes)) {
      log.error(new Error(`bber-output/footnotes:
        [bber.store] has not initialized in [Footnotes#testParams], aborting`), 1)
    }

    return fs.mkdirs(output, err => callback(err, this.footnotes))
  }

  init() {
    return new Promise(resolve =>
      this.testParams((err0, footnotes) => {
        if (err0) { throw err0 }
        if (!footnotes.length) {
          log.info('bber-output/footnotes: No footnotes found in source files')
          return resolve(footnotes)
        }
        log.info('bber-output/footnotes: Generating linked footnotes from data found in source')
        return this.writeFootnotes()
        .catch(err1 => log.error(err1))
        .then(resolve)
      })
    )
  }
}

const footnotes = new Footnotes()
export default footnotes.init
