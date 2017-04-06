
import Promise from 'vendor/Zousan'
import fs from 'fs-extra'
import path from 'path'
import readline from 'readline'
import cover from 'bber-output/cover'
import { log } from 'bber-plugins'
import { guid, src, dist } from 'bber-utils'

/**
 * @class Initialize
 */
class Initialize {
  get src() { // eslint-disable-line class-methods-use-this
    return src()
  }

  get dist() { // eslint-disable-line class-methods-use-this
    return dist()
  }

  /**
   * @constructor
   * @return {Object}
   */
  constructor() {
    this.dirs = [
      this.src,
      `${this.src}/_images`,
      `${this.src}/_javascripts`,
      `${this.src}/_stylesheets`,
      `${this.src}/_markdown`,
      `${this.src}/_fonts`,
      `${this.src}/.tmp`
    ]
    this.files = [{
      relpath: 'config.yml',
      content: `env: development # development | production
theme: default # name or path
src: ${path.basename(this.src)}
dist: ${path.basename(this.src).slice(1)}`
    }, {
      relpath: path.join(this.src, 'epub.yml'),
      content: ''
    }, {
      relpath: path.join(this.src, 'mobi.yml'),
      content: ''
    }, {
      relpath: path.join(this.src, 'sample.yml'),
      content: ''
    }, {
      relpath: path.join(this.src, 'web.yml'),
      content: ''
    }, {
      relpath: path.join(this.src, 'metadata.yml'),
      content: `-
  term: title
  value: Sample Book
  term_property: title-type
  term_property_value: main
-
  term: creator
  value: Author Name
  term_property: role
  term_property_value: aut
-
  term: contributor
  value: bber
  term_property: role
  term_property_value: ctb
-
  term: language
  value: en-US
-
  term: rights
  value: Sample Book © 2017
-
  term: format
  value: epub+zip
-
  term: date
  value: 2017-01-01
-
  term: publisher
  value: Triple Canopy
-
  term: date-modified
  value: 2017-01-01
-
  term: identifier
  value: ${guid()}`
    }, {
      relpath: `${this.src}/_javascripts/application.js`,
      content: 'if (console && console.log) { console.log(\'Hello World!\') }'
    }, {
      relpath: `${this.src}/_markdown/00001.md`,
      content: `---
title: Chapter One
type: bodymatter
---
`
    }]
  }

  /**
   * [_makeDirs description]
   * @return {Promise<Object|Error>}
   */
  _makeDirs() {
    return new Promise((resolve0) => {
      const promises = this.dirs.map(_ =>
        new Promise(resolve1 =>
          fs.ensureDir(_, (err) => {
            if (err) { throw err }
            resolve1()
          })
        )
      )
      return Promise.all(promises).then(resolve0)
    })
  }

  /**
   * [_writeFiles description]
   * @return {Promise<Object|Error>}
   */
  _writeFiles() {
    return new Promise((resolve0) => {
      const promises = this.files.map(_ =>
        new Promise(resolve1 =>
          fs.writeFile(_.relpath, _.content, (err) => {
            if (err) { throw err }
            resolve1()
          })
        )
      )
      return Promise.all(promises).then(resolve0)
    })
  }

  /**
   * [_removeDirs description]
   * @return {Promise<Object|Error>}
   */
  _removeDirs() {
    return new Promise(resolve =>
      fs.remove(this.dirs[0], (err) => {
        if (err) { throw err }
        resolve()
      })
    )
  }

  /**
   * [_removeConfig description]
   * @param  {Function} done [description]
   * @return {Promise<Object>}
   */
  _removeConfig(done) { // eslint-disable-line class-methods-use-this
    const configPath = path.join(process.cwd(), 'config.yml')
    return fs.unlink(configPath, (err) => {
      if (err) { throw err }
      return done()
    })
  }

  /**
   * [_removeConfigFile description]
   * @return {Promise<Object|Error>}
   */
  _removeConfigFile() {
    // necessary to remove the config to ensure that settings aren't carried
    // over from an existing project. there should be a better way of doing
    // this, though; a check that notifies users that they're in an existing
    // project directory, and a prompt to remove the existing data?
    return new Promise((resolve) => {
      const configPath = path.join(process.cwd(), 'config.yml')
      if (fs.existsSync(configPath)) {
        log.warn('It looks like this is an active project directory, are you sure you want to overwrite it?') // eslint-disable-line max-len
        if (process.env.NODE_ENV === 'test') { return this._removeConfig(resolve) }

        const prompt = readline.createInterface({
          input: process.stdin,
          output: process.stdout
        })

        const confirm = (callback) => {
          prompt.question('? Overwite existing config? (y|N) ', (_answer) => {
            const answer = _answer.toLowerCase().trim()
            if (answer === 'y' || answer === 'yes') {
              prompt.close()
              log.info('Overwriting project')
              return this._removeConfig(resolve)
            } else if (answer === 'n' || answer === 'no' || answer === '') {
              log.info('Aborting')
              return process.exit(0)
            }

            return confirm(callback)
          })
        }

        return confirm(() => this._removeConfig(resolve))
      }

      return resolve()
    })
  }

  /**
   * Write default directories and files to the source directory
   * @return {Promise<Object|Error>}
   */
  init() {
    return new Promise(resolve =>
      this._removeConfigFile()
      .then(() => this._removeDirs())
      .then(() => this._makeDirs())
      .then(() => this._writeFiles())
      .then(() => cover.generate())
      .catch(err => log.error(err))
      .then(resolve)
    )
  }
}

export default Initialize
