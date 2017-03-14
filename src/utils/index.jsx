
/* eslint-disable operator-linebreak */

/**
 * @module utils
 */

import fs from 'fs-extra'
import path from 'path'
import YAML from 'yamljs'
import { compact, find } from 'lodash'
import store from '../state/store'
import actions from '../state'
import config from '../config'

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
const opspath = (fpath, base) =>
  fpath.replace(new RegExp(`^${base}/OPS/?`), '')

const cjoin = arr =>
  compact(arr).join('\n')

// TODO: this should be more robust
const fileid = str =>
  '_'.concat(str.replace(/[\s:,“”‘’]/g, '_'))

const s4 = () =>
  Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1)

/**
 * Create a GUID
 * @return {String}
 */
const guid = () =>
  `${s4()}${s4()}${s4()}${s4()}${s4()}${s4()}${s4()}${s4()}`

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
    hash = ((hash << 5) - hash) + chr // eslint-disable-line no-bitwise
    hash |= 0 // eslint-disable-line no-bitwise
  }
  return `_${Math.abs(hash)}`
}

// TODO: move this into bber setter
//
const updateStore = (prop, { ...obj }) => {
  const { id } = obj
  if (!{}.hasOwnProperty.call(store, prop)) {
    throw new Error(`\`${prop}\` is not a member of the \`store\` object.`)
  }
  if (find(store[prop], { id })) {
    throw new Error(`The property ${prop} already contains an item with that \`id\`.`)
  }
  store[prop].push({ ...obj })
  return store
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
 * @yield {Array} [description]
 */
const entries = function* entries(obj) {
  for (const key of Object.keys(obj)) {
    yield [key, obj[key]]
  }
}


// getters

// utility for retrieving props from bber instance
const getVal = val =>
  config(instance => instance.bber[val])

const src = () => {
  const { build } = actions.getBber('build', 'bber')
  return path.join(cwd, getVal(build).src)
}

const dist = () => {
  const { build } = actions.getBber('build', 'bber')
  return path.join(cwd, getVal(build).dist)
}

const build = () => {
  const bber = actions.getBber('build')
  if (bber.build === null) { throw new Error('Missing keys `build` in `state`.') }
  return bber.build
}

const env = () =>
  getVal('env')

const theme = () => {
  const t = getVal('theme')
  return {
    tpath: path.join(cwd, 'themes', t),
    tname: t
  }
}

const metadata = () => {
  // try to get from config class, failing that, get from global store
  let data = getVal('metadata') || (() => {
    const { bber } = actions.getBber('bber')
    return bber.metadata
  })()

  // if still none, load the config files and then set the store with the
  // response for the next call
  if (!data) {
    const configPath = path.join(cwd, 'config.yml')
    try {
      if (fs.statSync(configPath)) {
        const conf = YAML.load(configPath)
        try {
          if (fs.statSync(path.join(cwd, conf.src, 'metadata.yml'))) {
            data = YAML.load(path.join(cwd, conf.src, 'metadata.yml'))
            actions.setBber({ bber: { metadata: data } })
          }
        } catch (err) {
          throw new Error(`Cannot find metadata.yml in ${path.basename(conf.src)}`)
        }
      }
    } catch (err) {
      throw new Error(`Cannot find config.yml in ${path.basename(cwd)}`)
    }
  }

  return data
}

const version = () =>
  getVal('version')

const promiseAll = promiseArray =>
  new Promise((resolve, reject) => {
    Promise.all(promiseArray).then(resolve)
  })

export {
  opspath, cjoin, fileid, copy, guid, rpad, lpad, hrtimeformat, hashIt,
  updateStore, getImageOrientation, getFrontmatter, orderByFileName, entries,
  src, dist, build, env, theme, version, metadata, promiseAll }

