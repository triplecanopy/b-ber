
import { isPlainObject, isArray, indexOf } from 'lodash'

/**
 * @class Store
 */
class Store {
  set pages(value) {
    this._pages = value
  }
  set images(value) {
    this._images = value
  }
  set build(value) {
    this._build = value
  }
  set bber(value) {
    this._bber = value
  }
  set cursor(value) { // used for tracking nested sections open/close ids
    this._cursor = value
  }

  get pages() {
    return this._pages
  }
  get images() {
    return this._images
  }
  get build() {
    return this._build
  }
  get bber() {
    return this._bber
  }
  get cursor() {
    return this._cursor
  }

  /**
   * @constructor
   * @return {Object} Instance of Store
   */
  constructor() {
    this.pages = []
    this.images = []
    this.build = null
    this.bber = {}
    this.cursor = []
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
      throw new TypeError(`Property [${prop}]$ cannot be set to [undefined]`)
    }

    return { _prop, _val }
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
    // TODO: option for deep merge?
    const { _prop, _val } = this._checkTypes(prop, val)
    this[_prop] = Object.assign({}, this[_prop], _val)
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
   * @param  {String} prop [description]
   * @param  {String} val  [description]
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
    this.build = null
    this.bber = {}
    return this
  }
}

const store = new Store()
export default store
