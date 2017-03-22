
/**
 * @module config
 */

import YAML from 'yamljs'
import path from 'path'
import fs from 'fs-extra'

const cwd = process.cwd()

/**
 * Load defaults and user settings
 * @alias module:config#Configuration
 */
class Configuration {

  /**
   * @constructor
   */
  constructor() {
    this.config = null
    this.metadata = null
  }

  /**
   * metadata setter
   * @param  {Object} data Metadata object
   */
  set metadata(data) {
    this._metadata = data
  }

  /**
   * metadata getter
   * @return {Object}
   */
  get metadata() {
    return this._metadata
  }

  /**
   * config setter
   * @param  {Object} data Config object
   */
  set config(data) {
    this._config = data
  }

  /**
   * config getter
   * @return {Object}
   */
  get config() {
    return this._config
  }

  /**
   * bber getter
   * @return {Object}
   */
  get bber() {
    return {
      ...this.config,
      metadata: this.metadata,
      sample: this.fileOrDefaults('sample'),
      epub: this.fileOrDefaults('epub'),
      mobi: this.fileOrDefaults('mobi'),
      pdf: this.fileOrDefaults('pdf'),
      web: this.fileOrDefaults('web')
    }
  }

  /**
   * Load default and user config files
   * @return {Promise<Object|Error>}
   */
  loadSettings() {
    const defaults = {
      src: '_book',
      dist: 'book',
      theme: 'default',
      reader: 'https://codeload.github.com/triplecanopy/b-ber-boiler/zip/master'
    }

    try {
      if (fs.statSync(path.join(cwd, 'config.yml'))) {
        this._config = Object.assign(defaults, YAML.load('./config.yml'))
      }
    } catch (e) {
      this._config = defaults
    }

    try {
      if (fs.statSync(path.join(cwd, 'package.json'))) {
        const pkg = JSON.parse(fs.readFileSync(path.join(cwd, 'package.json')))
        const { version } = pkg
        this._config.version = version
      }
    } catch (err) {
      throw err
    }
  }

  /**
   * Load user metadata files
   * @return {Promise<Object|Error>}
   */
  loadMetadata() {
    const fpath = path.join(cwd, this.config.src, 'metadata.yml')
    try {
      if (fs.statSync(fpath)) {
        this._metadata = YAML.load(fpath)
      }
    } catch (err) {
      this._metadata = []
    }
  }

  /**
   * Return defaults or user settings for build type
   * @param  {String} type Current build type (`epub`, `mobi`, `web`, `pdf`, `sample`)
   * @return {Object}
   */
  fileOrDefaults(type) {
    const buildConfig = { src: this.config.src, dist: `${this.config.dist}-${type}`, pageList: [] }
    const fpath = path.join(cwd, this.config.src, `${type}.yml`)
    try {
      if (fs.statSync(fpath)) {
        Object.assign(buildConfig, { pageList: YAML.load(fpath) })
      }
    } catch (err) {
      return buildConfig
    }
    return buildConfig
  }
}

export default Configuration
