
/* eslint-disable no-bitwise, no-mixed-operators */

/**
 * @module utils
 */

import Promise from 'vendor/Zousan'
import fs from 'fs-extra'
import path from 'path'
import { compact, find } from 'lodash'
import store from 'bber-lib/store'

const cwd = process.cwd()

/**
 * [description]
 * @param  {String} source [description]
 * @param  {String} target [description]
 * @return {Object}
 */
const copy = (source, target) =>
  new Promise((resolve, reject) => {
    const rd = fs.createReadStream(source)
    rd.on('error', reject)
    const wr = fs.createWriteStream(target)
    wr.on('error', reject)
    wr.on('finish', resolve)
    return rd.pipe(wr)
  })

/**
 * Get a file's relative path to the OPS
 * @param  {String} fpath File path
 * @param  {String} base  Book's base path
 * @return {String}
 */
const opsPath = (fpath, base) =>
  fpath.replace(new RegExp(`^${base}/OPS/?`), '')

/**
 * [description]
 * @param  {Array} arr [description]
 * @return {String}
 */
const cjoin = arr =>
  compact(arr).join('\n')

/**
 * [description]
 * @param  {String} str [description]
 * @return {String}
 */

// https://www.w3.org/TR/xml-names/#Conformance
const fileId = str => `_${str.replace(/[^a-zA-Z0-9_]/g, '_')}`

/**
 * Create a GUID
 * @return {String}
 * http://stackoverflow.com/questions/105034/how-to-create-a-guid-uuid-in-javascript
 */
const guid = () => {
  let d = new Date().getTime()
  const uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (d + (Math.random() * 16)) % 16 | 0
    d = Math.floor(d / 16)
    return (c === 'x' ? r : r & 0x7 | 0x8).toString(16)
  })
  return uuid
}

/**
 * Pad a string from the right
 * @param  {String} s Base string
 * @param  {String} a Character to pad with
 * @param  {String} n Length of output
 * @return {String}
 */
const rpad = (s, a, n) => {
  let str = s
  if (str.length >= n) { return str }
  while (str.length < n) { str += a }
  return str
}

/**
 * Pad a string from the left
 * @param  {String} s Base string
 * @param  {String} a Character to pad with
 * @param  {String} n Length of output
 * @return {String}
 */
const lpad = (s, a, n) => {
  let str = s
  if (str.length >= n) { return str }
  while (str.length < n) { str = a + str }
  return str
}

/**
 * [description]
 * @param  {Array} a [description]
 * @return {String}
 */
const hrtimeformat = (a) => {
  const s = (a[0] * 1000) + (a[1] / 1000000)
  return `${String(s).slice(0, -3)}ms`
}

/**
 * Create a hash from a string
 * @param  {String} str [description]
 * @return {String}
 */
const hashIt = (str) => {
  let hash = 0
  if (str.length === 0) { return hash }
  for (let i = 0, len = str.length; i < len; i++) {
    const chr = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + chr
    hash |= 0
  }
  return `_${Math.abs(hash)}`
}

/**
 * Determine an image's orientation
 * @param  {Number} w Image width
 * @param  {Number} h Image Height
 * @return {String}
 */
const getImageOrientation = (w, h) => {
  // assign image class based on w:h ratio
  const widthToHeight = w / h
  let imageType = null

  if (widthToHeight < 0.61) { imageType = 'portraitLong' }
  if (widthToHeight >= 0.61 && widthToHeight < 1) { imageType = 'portrait' }
  if (widthToHeight === 1) { imageType = 'square' }
  if (widthToHeight > 1) { imageType = 'landscape' }
  return imageType
}

/**
 * [description]
 * @param  {Object} file [description]
 * @param  {String} prop [description]
 * @return {String|Object<null>}
 */
const getFrontmatter = (file, prop) => {
  const filename = path.basename(file.name, '.xhtml')
  const found = find(store.pages, { filename })
  return found && {}.hasOwnProperty.call(found, prop) ? found[prop] : null
}

/**
 * Create an iterator from object's key/value pairs
 * @param {Object} obj [description]
 * @return {Iterable<Array>}
 */
const entries = function* entries(obj) {
  for (const key of Object.keys(obj)) {
    yield [key, obj[key]]
  }
}


/**
 * [description]
 * @return {String}
 */
const src = () => {
  if (!store.bber[store.build] || !store.bber[store.build].src) {
    store.update('build', 'epub')
  }
  return path.join(cwd, store.bber[store.build].src)
}

/**
 * [description]
 * @return {String}
 */

// same issue as above with `src` method
const dist = () => {
  if (!store.bber[store.build] || !store.bber[store.build].dist) {
    store.update('build', 'epub')
  }
  return path.join(cwd, store.bber[store.build].dist)
}


/**
 * [description]
 * @return {String}
 * @throws {TypeError} If the requested key does not exist in `Store`
 */
const build = () => {
  if (store.build === null) { throw new Error('Missing keys [build] in [Store]') }
  return store.build
}

/**
 * [description]
 * @return {String}
 */
const env = () => store.env

/**
 * [description]
 * @return {String}
 */
const version = () => store.version

// TODO: this should check that the theme exists in the `themes` dir
const theme = () => {
  const themeName = store.config.theme
  return { tpath: path.join(cwd, 'themes', themeName), tname: themeName }
}

/**
 * [description]
 * @return {Array}
 */
const metadata = () => store.bber.metadata

/**
 * [description]
 * @param  {Array<Object<Promise>>} promiseArray [description]
 * @return {Object<Promise|Error>}
 */
const promiseAll = promiseArray =>
  new Promise(resolve =>
    Promise.all(promiseArray).then(resolve)
  )

const htmlComment = str => `\n<!-- ${str} -->\n`

const passThrough = args => args

export { opsPath, cjoin, fileId, copy, guid, rpad, lpad, hrtimeformat, hashIt,
  getImageOrientation, getFrontmatter, entries, src, dist, build, env, theme,
  version, metadata, promiseAll, htmlComment, passThrough }
