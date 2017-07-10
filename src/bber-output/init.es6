import Promise from 'vendor/Zousan'
import fs from 'fs-extra'
import path from 'path'
import { log } from 'bber-plugins'
import store from 'bber-lib/store'
import {
  sourceDirs,
  config,
  metadata,
  javascripts,
  markdown,
  typeYaml,
  readme,
  gitignore,
} from 'bber-templates'


/**
 * @class Initializer
 */
class Initializer {
  set src(val) { this._src = val }
  set dist(val) { this._dist = val }
  set cwd(val) { this._cwd = val }
  set dirs(val) { this._dirs = val }
  set files(val) { this._files = val }
  set projectPath(val) { this._projectPath = val }

  get src() { return this._src }
  get dist() { return this._dist }
  get cwd() { return this._cwd }
  get dirs() { return this._dirs }
  get files() { return this._files }
  get projectPath() { return this._projectPath }

  /**
   * @constructor
   * @param  {Object} argv Command Line arguments
   * @return {Object}
   */
  constructor({ cwd, argv = { src: '_book', dist: 'book' } }) {
    if (!cwd) { throw new Error('Base directory not provided') }
    const { src, dist } = argv

    this.cwd = cwd
    this.src = src
    this.dist = dist
    this.dirs = []
    this.files = []

    this.projectPath = path.join(this.cwd, this.src)
    this.buildTypes = ['epub', 'mobi', 'pdf', 'sample', 'web']

    if (src) {
      store.bber.src = src
      store.bber.epub.src = src
      store.bber.mobi.src = src
      store.bber.pdf.src = src
      store.bber.web.src = src
    }
    if (dist && dist !== src) {
      store.bber.dist = dist
      store.bber.epub.dist = `${dist}-epub`
      store.bber.mobi.dist = `${dist}-mobi`
      store.bber.pdf.dist = `${dist}-pdf`
      store.bber.web.dist = `${dist}-web`
    }

    this.dirs = sourceDirs(this.projectPath)

    this.buildTypes.forEach(_ => this.files.push(typeYaml(this.projectPath, _)))
    this.files.push(config(this.projectPath, store.config.dist))
    this.files.push(metadata(this.projectPath))
    this.files.push(javascripts(this.projectPath))
    this.files.push(markdown(this.projectPath))
    this.files.push(readme(this.projectPath, cwd))
    this.files.push(gitignore(this.projectPath))
  }

  /**
   * [_makeDirs description]
   * @return {Promise<Object|Error>}
   */
  _makeDirs() {
    return new Promise((resolve0) => {
      const promises = this.dirs.map(_ =>
        new Promise(resolve1 =>
          fs.mkdirp(_, (err) => {
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
   * Write default directories and files to the source directory
   * @return {Promise<Object|Error>}
   */
  start() {
    return new Promise(resolve =>
      this._makeDirs()
      .then(() => this._writeFiles())
      // .then(() => cover.generate())
      // .then(() => this._createSample())
      .catch(err => log.error(err))
      .then(resolve)
    )
  }
}

export default Initializer
