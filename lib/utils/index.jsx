
/* eslint-disable operator-linebreak */

import fs from 'fs-extra'
import path from 'path'
import { compact, find } from 'lodash'
import store from '../state/store'
import actions from '../state'

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

const opspath = (fpath, base) =>
  fpath.replace(new RegExp(`^${base}/OPS/?`), '')

const cjoin = arr =>
  compact(arr).join('\n')

const fileid = str =>
  '_'.concat(str.replace(/[\s:,“”‘’]/g, '_'))

const s4 = () =>
  Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1)

const guid = () =>
  `${s4()}${s4()}${s4()}${s4()}${s4()}${s4()}${s4()}${s4()}`

const rpad = (s, a, n) => {
  let str = s
  if (str.length >= n) { return str }
  while (str.length < n) { str += a }
  return str
}

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

const entries = function* (obj) {
  for (const key of Object.keys(obj)) {
    yield [key, obj[key]]
  }
}

const src = () => {
  const { build, bber } = actions.getBber('build', 'bber')
  if (!build || !bber) { throw new Error('Missing keys `build` or `bber` in `state`.') }
  const { src } = bber[build]
  return path.join(cwd, src)
}

const dist = () => {
  const { build, bber } = actions.getBber('build', 'bber')
  if (!build || !bber) { throw new Error('Missing keys `build` or `bber` in `state`.') }
  const { dist } = bber[build]
  return path.join(cwd, dist)
}

const build = () => {
  const { build } = actions.getBber('build')
  if (build === null) { throw new Error('Missing keys `build` in `state`.') }
  return build
}

const env = () => {
  const { bber } = actions.getBber('bber')
  const { env } = bber
  return env
}

const theme = () => {
  const { bber } = actions.getBber('bber')
  const { theme } = bber
  return {
    tpath: path.join(cwd, 'themes', theme),
    tname: theme
  }
}

const version = () => {
  const pkg = JSON.parse(fs.readFileSync(path.join(cwd, 'package.json')))
  const { version } = pkg
  return version || ''
}

export {
  opspath, cjoin, fileid, copy, guid, rpad, lpad, hrtimeformat, hashIt,
  updateStore, getImageOrientation, getFrontmatter, orderByFileName, entries,
  src, dist, build, env, theme, version }

