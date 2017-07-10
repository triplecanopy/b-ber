/* eslint-disable no-multi-spaces */
import Yaml from 'bber-lib/yaml'
import path from 'path'
import fs from 'fs-extra'
import { isPlainObject, isArray, findIndex } from 'lodash'
import { log } from 'bber-plugins'
import {
  createPageModelsFromYAML,
  flattenNestedEntries,
  createPagesMetaYaml,
} from 'bber-lib/helpers'

import util from 'util'

const cwd = process.cwd()

/**
 * @class Store
 */
class Store {
  set env(value)        { this._env = value       }
  set pages(value)      { this._pages = value     }
  set images(value)     { this._images = value    }
  set footnotes(value)  { this._footnotes = value }
  set build(value)      { this._build = value     }
  set bber(value)       { this._bber = value      }
  set cursor(value)     { this._cursor = value    } // used for tracking nested sections open/close ids
  set config(value)     { this._config = value    }
  set metadata(value)   { this._metadata = value  }
  set version(value)    { this._version = value   }
  set spine(value)      { this._spine = value     }
  set toc(value)        { this._toc = value       }

  get env()             { return this._env        }
  get pages()           { return this._pages      }
  get images()          { return this._images     }
  get footnotes()       { return this._footnotes  }
  get build()           { return this._build      }
  get bber()            { return this._bber       }
  get cursor()          { return this._cursor     }
  get config()          { return this._config     }
  get metadata()        { return this._metadata   }
  get spine()           { return this._spine      }
  get toc()             { return this._toc        }

  /**
   * @constructor
   * @return {Object} Instance of Store
   */
  constructor() {
    this.loadInitialState()
  }

  /**
   * Validate input before getting/setting Store properties
   * @param  {String} prop Property to validate
   * @param  {*}      val  Value to validate (not `undefined`)
   * @return {Object}
   */
  _checkTypes(prop, val) {
    const _prop = `_${prop}`
    const _val = val
    if (!{}.hasOwnProperty.call(this, _prop)) {
      throw new TypeError(`Attempting to add non-existent property [${prop}] to class [Store]`) // eslint-disable-line max-len
    }

    if (typeof _val === 'undefined') {
      throw new TypeError(`Property [${prop}] cannot be set to [undefined]`)
    }

    return { _prop, _val }
  }

  _fileOrDefaults(type) {
    const { src, dist } = this.config
    const yamlPath = path.join(cwd, src, `${type}.yml`)

    let spineList = []
    let spineEntries = []
    let tocEntries = []

    try {
      if (fs.existsSync(yamlPath)) {
        spineList = Yaml.load(yamlPath) || []
        tocEntries = createPageModelsFromYAML(spineList, src) // for book flow
        spineEntries = flattenNestedEntries(tocEntries) // for nested navigation
      } else {
        throw new Error(`[${type}.yml] not found. Creating default file.`)
      }
    } catch (err) {
      if (/Creating default file/.test(err.message)) {
        log.info(err.message)
        // createPagesMetaYaml(src, type)
      } else {
        throw err
      }
    }

    return {
      src,
      dist: `${dist}-${type}`,
      spineList,
      spineEntries,
      tocEntries,
    }
  }

  /**
   * Add an entry to an Object or Array property of Store
   * @param  {String} prop Property name
   * @param {*}       val Value to add
   * @return {*}
   */
  add(prop, val) {
    const { _prop, _val } = this._checkTypes(prop, val)

    if (isArray(this[_prop])) {
      this[_prop] = [...this[_prop], _val]
      return this[_prop]
    }

    if (isPlainObject(this[_prop])) {
      this[_prop] = { ...this[_prop], _val }
      return this[_prop]
    }

    if (typeof this[_prop] === 'string') {
      this[_prop] = this[_prop] + String(val)
      return this[_prop]
    }

    throw new Error('Something went wrong in `Store#add`')
  }

  /**
   * Remove an entry from an Object or Array
   * @param  {String} prop Property name
   * @param  {*}      val Value to remove
   * @return {*}
   */
  remove(prop, val) {
    const { _prop, _val } = this._checkTypes(prop, val)
    if (isArray(this[_prop])) {
      let index
      try {
        index = findIndex(this[_prop], _val)
        if (index < 0) {
          throw new TypeError(`The _property [${val}] could not be found in [${this[prop]}]`)
        }
      } catch (err) {
        return err
      }

      this[_prop].splice(index, 1)
      return this[_prop]
    }

    if (isPlainObject(this[_prop])) {
      delete this[_prop][_val]
      return this[_prop]
    }

    throw new Error('Something went wrong in `Store#remove`')
  }

  /**
   * Merge an Object into a property of Store
   * @param  {String} prop Store key
   * @param  {Object} val  Object to merge into `key`
   * @return {Object}      Merged object
   */
  merge(prop, val) {
    const { _prop, _val } = this._checkTypes(prop, val)
    this[_prop] = { ...this[_prop], ..._val }
    return this[_prop]
  }

  /**
   * Update a property of Store
   * @param  {String} prop Property name
   * @param  {*} val  New value
   * @return {*}      Updated property
   */
  update(prop, val) {
    this[`_${prop}`] = val
    return this[`_${prop}`]
  }

  /**
   * [contains description]
   * @param  {String} collection  [description]
   * @param  {String} value       [description]
   * @return {Integer}
   */
  contains(collection, value) {
    if (!isArray(this[collection])) {
      throw new TypeError('[Store#contains] must be called on an array')
    }
    return findIndex(this[collection], value)
  }

  /**
   * Restore initial state of store
   * @return {Object} Store
   */

  loadInitialState() {
    this.pages = []
    this.images = []
    this.footnotes = []
    this.build = 'epub'
    this.bber = {}
    this.cursor = []
    this.metadata = []
    this.spine = []
    this.toc = []
    this.env = process.env.NODE_ENV || 'development'
    this.config = {
      src: '_book',
      dist: 'book',
      theme: 'default',
      reader: 'https://codeload.github.com/triplecanopy/b-ber-boiler/zip/master',
    }

    this.loadSettings()
    this.loadMetadata()
    this.loadBber()
  }

  reload() {
    this.pages = []
    this.images = []
    this.footnotes = []
    this.cursor = []
    this.spine = []
    this.toc = []
  }

  reset() {
    this.loadInitialState()
  }

  loadSettings() {
    if (fs.existsSync(path.join(cwd, 'package.json'))) {
      const { version } = JSON.parse(fs.readFileSync(path.join(cwd, 'package.json')))
      this.version = version
    }

    if (fs.existsSync(path.join(cwd, 'config.yml'))) {
      this.config = { ...this.config, ...Yaml.load(path.join(cwd, './config.yml')) }
    }
  }

  // depends on `config.src`
  loadMetadata() {
    const fpath = path.join(cwd, this.config.src, 'metadata.yml')
    if (fs.existsSync(fpath)) {
      this.metadata = [...this.metadata, ...Yaml.load(fpath)]
    }
  }

  loadBber() {
    this.bber = {
      metadata: this.metadata,
      sample: this._fileOrDefaults('sample'),
      epub: this._fileOrDefaults('epub'),
      mobi: this._fileOrDefaults('mobi'),
      pdf: this._fileOrDefaults('pdf'),
      web: this._fileOrDefaults('web'),
    }
  }
}

const store = new Store()

// console.log(util.inspect(store, true, null))
export default store
