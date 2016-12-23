
import fs from 'fs-extra'
import { compact, findWhere } from 'underscore'
import conf from './config'
import store from './store'

const copy = (source, target) =>
  new Promise((resolve, reject) => {
    const rd = fs.createReadStream(source)
    rd.on('error', reject)
    const wr = fs.createWriteStream(target)
    wr.on('error', reject)
    wr.on('finish', resolve)
    return rd.pipe(wr)
  })

const slashit = (str) => {
  let fpath = str
  try {
    if (typeof fpath !== 'string') {
      throw new Error(`Path must be a string. '${typeof fpath}' given.`)
    }
  } catch (err) {
    throw err
  }

  if (fpath.substr(-1) !== '/') {
    fpath = fpath.concat('/')
  }

  return fpath
}

const topdir = file => file.replace(new RegExp(`^${conf.dist}/OPS/?`), '')
const cjoin = arr => compact(arr).join('\n')
const fileid = str => '_'.concat(str.replace(/[\s:,“”‘’]/g, '_'))
const s4 = () => Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1)
const guid = () => `${s4()}${s4()}${s4()}${s4()}${s4()}${s4()}${s4()}${s4()}`
const regexMap = arr => new RegExp(arr.map(_ => _.source).join(''))

const rpad = (s, a, n) => {
  let str = s
  if (str.length >= n) { return str }
  while (str.length < n) { str += a }
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

const updateStore = (prop, { ...obj }) => {
  const { id } = obj
  if (findWhere(store[prop], { id })) {
    throw new Error(`The property ${prop} already contains an item with that \`id\`.`)
  }
  store[prop].push({ ...obj })
  return store
}

export { slashit, topdir, cjoin, fileid, copy, guid, rpad, hrtimeformat, hashIt, regexMap, updateStore }

