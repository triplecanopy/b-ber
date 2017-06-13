/* eslint-disable no-multi-spaces */
import YAML from 'yamljs'
import path from 'path'
import fs from 'fs-extra'
import { isPlainObject, isArray, indexOf } from 'lodash'

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

  get env()             { return this._env        }
  get pages()           { return this._pages      }
  get images()          { return this._images     }
  get footnotes()       { return this._footnotes  }
  get build()           { return this._build      }
  get bber()            { return this._bber       }
  get cursor()          { return this._cursor     }
  get config()          { return this._config     }
  get metadata()        { return this._metadata   }

  /**
   * @constructor
   * @return {Object} Instance of Store
   */
  constructor() {
    this.pages = []
    this.images = []
    this.footnotes = []
    this.build = 'epub'
    this.bber = {}
    this.cursor = []
    this.metadata = []
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
    const fpath = path.join(cwd, src, `${type}.yml`)
    return { src, dist: `${dist}-${type}`, pageList: fs.existsSync(fpath) ? YAML.load(fpath) : [] }
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
      this[_prop].push(_val)
      return this[_prop]
    }

    if (isPlainObject(this[_prop])) {
      this[_prop] = Object.assign({}, _val)
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
        index = indexOf(this[_prop], _val)
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
      throw new TypeError('[Store#contains] must be called with an array')
    }
    const index = this[collection].indexOf(value)
    return index
  }

  /**
   * Restore initial state of store
   * @return {Object} Store
   */
  reset() {
    this.pages = []
    this.images = []
    this.footnotes = []
    this.build = 'epub'
    this.bber = {}
    this.env = 'development'
    this.config = {}
    this.metadata = []
    return this
  }


  // from loader
  //
  //

  loadSettings() {
    if (fs.existsSync(path.join(cwd, 'config.yml'))) {
      this.config = { ...this.config, ...YAML.load('./config.yml') }
    }

    if (fs.existsSync(path.join(cwd, 'package.json'))) {
      const { version } = JSON.parse(fs.readFileSync(path.join(cwd, 'package.json')))
      this.config = { ...this.config, version }
    }
  }

  // depends on `config.src`
  loadMetadata() {
    const fpath = path.join(cwd, this.config.src, 'metadata.yml')
    if (fs.existsSync(fpath)) {
      this.metadata = [...this.metadata, ...YAML.load(fpath)]
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
export default store
