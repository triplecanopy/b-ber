import crypto from 'crypto'
import isPlainObject from 'lodash/isPlainObject'
import isArray from 'lodash/isArray'
import findIndex from 'lodash/findIndex'
import ApplicationLoader from './ApplicationLoader'

const dynamicPageTmpl = _ => {
    throw new Error(
        '[state.templates#dynamicPageTmpl] has not been initialized in b-ber-modifiers/inject',
    )
}
const dynamicPageHead = _ => {
    throw new Error(
        '[state.templates#dynamicPageHead] has not been initialized in b-ber-modifiers/inject',
    )
}
const dynamicPageTail = _ => {
    throw new Error(
        '[state.templates#dynamicPageTail] has not been initialized in b-ber-modifiers/inject',
    )
}

class State extends ApplicationLoader {
    static defaults = {
        guide: [],
        figures: [],
        footnotes: [],
        build: 'epub',
        cursor: [],
        spine: [],
        toc: [],
        remoteAssets: [],
        loi: [],
        sequence: [],
        hash: crypto.randomBytes(20).toString('hex'),

        // for dynamically created templates. functions here are overwritten
        // during build. see b-ber-modifiers/inject#mapSourcesToDynamicPageTemplate
        templates: { dynamicPageTmpl, dynamicPageHead, dynamicPageTail },
    }

    constructor() {
        super()

        this._resetEntries()
        this._resetConfig()
        this.load()
    }

    get src() {
        return this.config.src
    }
    get dist() {
        if (this.build && this.buildTypes && this.buildTypes[this.build]) {
            return this.buildTypes[this.build].dist
        }
        return this.config.dist
    }

    // eslint-disable-next-line class-methods-use-this
    get env() {
        return process.env.NODE_ENV || 'development'
    }

    set src(val) {
        this.config.src = val
    }
    set dist(val) {
        this.config.dist = val
    }

    set env(val) {
        this.config.env = val
    }

    reset() {
        this._resetEntries()
        this._resetConfig()

        this.templates = { dynamicPageTmpl, dynamicPageHead, dynamicPageTail }
        this.hash = crypto.randomBytes(20).toString('hex')
    }

    _resetEntries() {
        Object.entries(State.defaults).forEach(
            ([key, val]) => (this[key] = val),
        )
    }

    /**
     * Add an entry to an Object or Array property of State
     * @param  {String} prop Property name
     * @param {*}       val Value to add
     * @return {*}
     */
    add(prop, val) {
        if (isArray(this[prop])) {
            this[prop] = [...this[prop], val]
            return
        }

        if (isPlainObject(this[prop])) {
            this[prop] = { ...this[prop], val }
            return
        }

        if (typeof this[prop] === 'string') {
            this[prop] = this[prop] + String(val)
            return
        }

        throw new Error('Something went wrong in `State#add`')
    }

    /**
     * Remove an entry from an Object or Array
     * @param  {String} prop Property name
     * @param  {*}      val Value to remove
     * @return {*}
     */
    remove(prop, val) {
        if (isArray(this[prop])) {
            const index = findIndex(this[prop], val)
            if (index < 0) {
                throw new TypeError(
                    `The _property [${val}] could not be found in [state.${prop}]`,
                )
            }
            this[prop].splice(index, 1)
            return
        }

        if (isPlainObject(this[prop])) {
            delete this[prop][val]
            return
        }

        throw new Error('Something went wrong in `State#remove`')
    }

    /**
     * Merge an Object into a property of State
     * @param  {String} prop State key
     * @param  {Object} val  Object to merge into `key`
     * @return {Object}      Merged object
     */
    merge(prop, val) {
        if (!isPlainObject(this[prop]) || !isPlainObject(val)) {
            throw new Error('Attempting to merge non-object in [State#merge]')
        }
        this[prop] = { ...this[prop], ...val }
    }

    /**
     * Update a property of State
     * Accepts nested objects up to one level
     * @param  {String} prop Property name
     * @param  {*} val  New value
     * @return {*}      Updated property
     * @example         state.update('config.base_url', '/')
     */
    update(prop, val) {
        const [key, rest] = prop.split('.')
        if ({}.hasOwnProperty.call(this, key)) {
            if (rest) {
                this[key][rest] = val
            } else {
                this[key] = val
            }
        }

        return this[key]
    }

    /**
     * [contains description]
     * @param  {String} collection  [description]
     * @param  {String} value       [description]
     * @return {Integer}            Returns an index, so checks should be against -1 for existence
     */
    contains(collection, value) {
        if (!isArray(this[collection])) {
            throw new TypeError('[State#contains] must be called on an array')
        }
        return findIndex(this[collection], value)
    }
}

const state = new State()
export default state
