
/* eslint-disable no-bitwise, no-mixed-operators */

/**
 * @module utils
 */

import Promise from 'zousan'
import fs from 'fs-extra'
import path from 'path'
import { compact, find, isPlainObject } from 'lodash'
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
 * @param  {String} base  Project's base path
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
 * @param {Object} collection   [description]
 * @param {Object} iterator     [description]
 * @return {*}
 */
const forOf = (collection, iterator) =>
  Object.entries(collection).forEach(([key, val]) =>
    iterator(key, val)
  )


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
  const name = store.config.theme
  return {
    name,
    root: path.join(__dirname, '../../', 'themes'),
    path: path.join(__dirname, '../../', 'themes', name),
  }
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

const escapeHTML = (str) => {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }
  return str.replace(/[&<>"']/g, m => map[m])
}

// for generating page models used in navigation
const spineModel = () => ({
  relativePath: '',
  absolutePath: '',
  extension: '',
  fileName: '',
  name: '', // filename without extension
  remotePath: '',
  linear: true,
  in_toc: true,
  // inToc: true,
  nodes: [],
})

/**
 * [description]
 * @param {String} _str    File basename with extension
 * @param {String} _src   Current `src` directory name
 * @return {Object}
 */
const modelFromString = (_str, _src) => {
  const str = String(_str)
  const pathFragment = /^(toc\.xhtml|nav\.ncx)$/.test(str) ? '' : 'text' // TODO: clean this up
  const relativePath = path.join(pathFragment, str) // relative to OPS
  const absolutePath = path.join(cwd, _src, relativePath)
  const extension = path.extname(absolutePath)
  const fileName = path.basename(absolutePath)
  const name = path.basename(absolutePath, extension)
  const remotePath = absolutePath // TODO: add remote URL where applicable
  return {
    ...spineModel(),
    relativePath,
    absolutePath,
    extension,
    fileName,
    name,
    remotePath,
  }
}

const modelFromObject = (_obj, _src) => {
  const { in_toc, linear } = _obj[Object.keys(_obj)[0]]
  // const obj = {}

  // if (typeof linear !== 'undefined') { obj.linear = linear }
  // if (typeof in_toc !== 'undefined') { obj.inToc = in_toc } // eslint-disable-line camelcase

  const str = Object.keys(_obj)[0]
  const model = modelFromString(str, _src)

  return { ...model, in_toc, linear }
}

const nestedContentToYAML = (arr, result = []) => {
  arr.forEach((_) => {
    const model = {}

    // TODO: check for custom attrs somewhere else. also - not sure about
    // changing snakecase/camelcase all the time, better to just stick with
    // one way or the other
    // if (_.linear === false || _.inToc === false) {
      // if (_.inToc === false) { model.in_toc = false }
    if (_.linear === false || _.in_toc === false) {
      if (_.in_toc === false) { model.in_toc = false }
      if (_.linear === false) { model.linear = false }
      result.push({ [_.fileName]: model })
    } else {
      result.push(_.fileName)
      if (_.nodes && _.nodes.length) {
        model.section = []
        result.push(model)
        nestedContentToYAML(_.nodes, model.section)
      }
    }
  })

  return result
}


const flattenSpineFromYAML = arr =>
  arr.reduce((acc, curr) => {
    if (isPlainObject(curr)) {
      if (Object.keys(curr)[0] === 'section') {
        return acc.concat(flattenSpineFromYAML(curr.section))
      }
      return acc.concat(Object.keys(curr)[0])
    }
    return acc.concat(curr)
  }, [])

export { opsPath, cjoin, fileId, copy, guid, lpad, hrtimeformat, hashIt,
  getImageOrientation, getFrontmatter, forOf, src, dist, build, env, theme,
  version, metadata, promiseAll, htmlComment, passThrough, escapeHTML,
  spineModel, modelFromObject, modelFromString, nestedContentToYAML,
  flattenSpineFromYAML }
