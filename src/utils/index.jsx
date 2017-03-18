
/* eslint-disable no-bitwise, no-mixed-operators */

/**
 * @module utils
 */

import fs from 'fs-extra'
import path from 'path'
import YAML from 'yamljs'
import { compact, find } from 'lodash'
import { loader } from 'lib'
import store from 'lib/store'

const cwd = process.cwd()

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

const cjoin = arr =>
  compact(arr).join('\n')

const fileId = str =>
  '_'.concat(str.replace(/[^0-9a-z]/gi, '_'))

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


const hrtimeformat = (a) => {
  const s = (a[0] * 1000) + (a[1] / 1000000)
  return `${String(s).slice(0, -3)}ms`
}

/**
 * Create a hash from a string
 * @param  {String} str
 * @return {String}
 */
const hashIt = (str) => {
  let hash = 0
  if (str.length === 0) { return hash }
  for (let i = 0, len = str.length; i < len; i++) { // eslint-disable-line no-plusplus
    const chr = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + chr
    hash |= 0
  }
  return `_${Math.abs(hash)}`
}

const updateStore = (prop, item) => store.add(prop, item)

// const updateStore = (prop, { ...obj }) => {
  // const { id } = obj
  // if (!{}.hasOwnProperty.call(store, prop)) {
  //   throw new Error(`\`${prop}\` is not a member of the \`store\` object.`)
  // }
  // if (find(store[prop], { id })) {
  //   throw new Error(`The property ${prop} already contains an item with that \`id\`.`)
  // }
  // store[prop].push({ ...obj })
  // return store
// }

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

const getFrontmatter = (file, prop) => {
  const filename = path.basename(file.name, '.xhtml')
  const found = find(store.pages, { filename })
  return found && {}.hasOwnProperty.call(found, prop) ? found[prop] : null
}

const orderByFileName = (filearr) => {
  if (!filearr || !filearr.length) { return [] }
  return filearr.sort((a, b) => {
    const seqA = a.name.split('_')[0]
    const seqB = b.name.split('_')[0]
    return seqA < seqB ? -1 : seqA > seqB ? 1 : 0 // eslint-disable-line no-nested-ternary
  })
}

/**
 * Create an iterator from object's key/value pairs
 * @param {Object} obj [description]
 * @returns {Iterable<Array>}
 */
const entries = function* entries(obj) {
  for (const key of Object.keys(obj)) {
    yield [key, obj[key]]
  }
}


// getters

const getConfigValue = (val) => {
  return loader((instance) => {
    return instance._config[val]
  })
}

const getConfigObject = (key) =>
  loader(instance => instance[`_${key}`])


// TODO: we need to make sure that `store` and `store.bber` have been
// instantiated, can probably just do this by wrapping them in a check and
// falling back to the `loader` method
const src = () => {
  return path.join(cwd, store.bber[store.build].src)
}

const dist = () => {
  return path.join(cwd, store.bber[store.build].dist)
}

const build = () => {
  if (store.build === null) { throw new Error('Missing keys `build` in `state`.') }
  return store.build
}

const env = () => getConfigValue('env')

const version = () => getConfigValue('version')

// TODO: this should check that the theme exists in the `themes` dir
const theme = () => {
  const t = getConfigValue('theme')
  return { tpath: path.join(cwd, 'themes', t), tname: t }
}

const metadata = () =>
  getConfigObject('metadata')

// const metadata = () => {
//   // try to get from config class, failing that, get from global store
//   let data = getConfigValue('metadata') || (() => {
//     const { bber } = store
//     return bber.metadata
//   })()

//   // if still none, load the config files and then set the store with the
//   // response for the next call
//   if (!data) {
//     const configPath = path.join(cwd, 'config.yml')
//     try {
//       if (fs.statSync(configPath)) {
//         const conf = YAML.load(configPath)
//         try {
//           if (fs.statSync(path.join(cwd, conf.src, 'metadata.yml'))) {
//             data = YAML.load(path.join(cwd, conf.src, 'metadata.yml'))
//             store.merge('bber', { metadata: data })
//           }
//         } catch (err) {
//           throw new Error(`Cannot find metadata.yml in ${path.basename(conf.src)}`)
//         }
//       }
//     } catch (err) {
//       throw new Error(`Cannot find config.yml in ${path.basename(cwd)}`)
//     }
//   }

//   return data
// }

const promiseAll = promiseArray =>
  new Promise(resolve/* , reject */ =>
    Promise.all(promiseArray).then(resolve)
  )

export {
  opsPath, cjoin, fileId, copy, guid, rpad, lpad, hrtimeformat, hashIt,
  updateStore, getImageOrientation, getFrontmatter, orderByFileName, entries,
  src, dist, build, env, theme, version, metadata, promiseAll }

