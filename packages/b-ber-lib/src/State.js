/* eslint-disable no-continue */
import crypto from 'crypto'
import isPlainObject from 'lodash/isPlainObject'
import isArray from 'lodash/isArray'
import find from 'lodash/find'
import findIndex from 'lodash/findIndex'
import set from 'lodash/set'
import get from 'lodash/get'
import merge from 'lodash/merge'
import remove from 'lodash/remove'
import path from 'path'
import fs from 'fs-extra'
import mime from 'mime-types'
import themeSerif from '@canopycanopycanopy/b-ber-theme-serif'
import themeSans from '@canopycanopycanopy/b-ber-theme-sans'
import log from '@canopycanopycanopy/b-ber-logger'
import Yaml from './Yaml'
import Config from './Config'
import Spine from './Spine'

const themes = {
  'b-ber-theme-serif': themeSerif,
  'b-ber-theme-sans': themeSans,
}

const randomHash = () => crypto.randomBytes(20).toString('hex')

const skipInitialization = () => {
  const { argv } = process

  // prettier-ignore
  return (
    argv.includes('--help') ||  // if a help flag is set
    argv.includes('-h') ||      // if a help alias is set
    argv.length < 3 ||          // if there are insufficient arguments
    argv.includes('new')        // if it's a new project
  )
}

const SRC_DIR_IMAGES = '_images'
const SRC_DIR_MARKDOWN = '_markdown'
const SRC_DIR_STYLESHEETS = '_stylesheets'
const SRC_DIR_JAVASCRIPTS = '_javascripts'
const SRC_DIR_FONTS = '_fonts'
const SRC_DIR_MEDIA = '_media'

const DIST_DIR_OPS = 'OPS'
const DIST_DIR_TEXT = 'text'
const DIST_DIR_IMAGES = 'images'
const DIST_DIR_STYLESHEETS = 'stylesheets'
const DIST_DIR_JAVASCRIPTS = 'javascripts'
const DIST_DIR_FONTS = 'fonts'
const DIST_DIR_MEDIA = 'media'

class State {
  static get defaults() {
    return {
      build: 'epub',
      sequence: [],
      hash: randomHash(),
    }
  }

  metadata = { json: () => [{}] } // mocks the YAML api

  theme = {}

  video = []

  audio = []

  media = {}

  build = 'epub'

  sequence = []

  hash = randomHash()

  builds = {
    sample: {},
    epub: {},
    mobi: {},
    pdf: {},
    web: {},
    reader: {},
  }

  get spine() {
    return this.builds[this.build].spine
  }

  set spine(val) {
    this.builds[this.build].spine = val
  }

  get guide() {
    return this.builds[this.build].guide
  }

  set guide(val) {
    this.builds[this.build].guide = val
  }

  get figures() {
    return this.builds[this.build].figures
  }

  set figures(val) {
    this.builds[this.build].figures = val
  }

  get footnotes() {
    return this.builds[this.build].footnotes
  }

  set footnotes(val) {
    this.builds[this.build].footnotes = val
  }

  get cursor() {
    return this.builds[this.build].cursor
  }

  set cursor(val) {
    this.builds[this.build].cursor = val
  }

  get toc() {
    return this.builds[this.build].toc
  }

  set toc(val) {
    this.builds[this.build].toc = val
  }

  get remoteAssets() {
    return this.builds[this.build].remoteAssets
  }

  set remoteAssets(val) {
    this.builds[this.build].remoteAssets = val
  }

  get loi() {
    return this.builds[this.build].loi
  }

  set loi(val) {
    this.builds[this.build].loi = val
  }

  get srcDir() {
    return this.config.src
  }

  set srcDir(val) {
    this.config.src = val
  }

  get distDir() {
    if (this.build && this.builds && this.builds[this.build]) {
      return this.builds[this.build].dist
    }
    return this.config.dist
  }

  set distDir(val) {
    this.config.dist = val
  }

  // eslint-disable-next-line class-methods-use-this
  get env() {
    return process.env.NODE_ENV || 'development'
  }

  set env(val) {
    this.config.env = val
  }

  src = {
    root: (...args) => path.join(this.srcDir, ...args),
    images: (...args) => path.join(this.srcDir, SRC_DIR_IMAGES, ...args),
    markdown: (...args) => path.join(this.srcDir, SRC_DIR_MARKDOWN, ...args),
    stylesheets: (...args) =>
      path.join(this.srcDir, SRC_DIR_STYLESHEETS, ...args),
    javascripts: (...args) =>
      path.join(this.srcDir, SRC_DIR_JAVASCRIPTS, ...args),
    fonts: (...args) => path.join(this.srcDir, SRC_DIR_FONTS, ...args),
    media: (...args) => path.join(this.srcDir, SRC_DIR_MEDIA, ...args),
  }

  dist = {
    root: (...args) => path.join(this.distDir, ...args),
    ops: (...args) => path.join(this.distDir, DIST_DIR_OPS, ...args),
    text: (...args) =>
      path.join(this.distDir, DIST_DIR_OPS, DIST_DIR_TEXT, ...args),
    images: (...args) =>
      path.join(this.distDir, DIST_DIR_OPS, DIST_DIR_IMAGES, ...args),
    stylesheets: (...args) =>
      path.join(this.distDir, DIST_DIR_OPS, DIST_DIR_STYLESHEETS, ...args),
    javascripts: (...args) =>
      path.join(this.distDir, DIST_DIR_OPS, DIST_DIR_JAVASCRIPTS, ...args),
    fonts: (...args) =>
      path.join(this.distDir, DIST_DIR_OPS, DIST_DIR_FONTS, ...args),
    media: (...args) =>
      path.join(this.distDir, DIST_DIR_OPS, DIST_DIR_MEDIA, ...args),
  }

  constructor() {
    let version

    // for testing, since our directory structure is different in dist
    try {
      ;({ version } = fs.readJSONSync(require.resolve('./package.json')))
    } catch (err) {
      ;({ version } = fs.readJSONSync(require.resolve('../package.json')))
    }

    set(this, 'version', version)
    set(this, 'config', new Config())

    this.reset()
    this.loadMetadata()
    this.loadAudioVideo()
    this.loadMedia()
    this.loadBuilds()
    this.loadTheme()
  }

  reset = () => {
    Object.entries(State.defaults).forEach(([key, val]) => set(this, key, val))
    this.loadConfig()
  }

  add = (prop, value) => {
    const prevValue = get(this, prop)

    if (isArray(prevValue)) {
      set(this, prop, [...prevValue, value])
    } else if (isPlainObject(prevValue)) {
      set(this, prop, { ...prevValue, value })
    } else if (typeof prevValue === 'string') {
      set(this, prop, `${prevValue}${value}`)
    } else {
      log.error(`Cannot add [${value}] to [state.${prop}]`)
    }
  }

  remove = (prop, value) => {
    const prevValue = get(this, prop)

    if (isArray(prevValue)) {
      const arr = [...prevValue]
      remove(arr, value)
      set(this, prop, arr)
    } else if (isPlainObject(prevValue)) {
      const { [value]: _, ...rest } = prevValue // eslint-disable-line no-unused-vars
      set(this, prop, rest)
    } else {
      log.error(`Cannot remove [${value}] from [state.${prop}]`)
    }
  }

  merge = (prop, value) => {
    const oldValue = get(this, prop)
    set(this, prop, merge(oldValue, value))
  }

  update = (prop, val) => {
    set(this, prop, val)
  }

  contains = (coll, value) => this.indexOf(coll, value) > -1

  find = (coll, pred) => {
    const collection = get(this, coll)
    return find(collection, pred)
  }

  indexOf = (coll, pred) => {
    const collection = get(this, coll)
    return findIndex(collection, pred)
  }

  loadConfig = () => {
    if (!fs.existsSync(path.resolve('config.yml'))) return

    const config = new Yaml('config')
    config.load(path.resolve('config.yml'))

    // not necessary right now to pass around a YAWN instance since we'er
    // not writing back to config.yml, but may be necessary at some point
    set(this, 'config', new Config(config.json()))
  }

  loadMetadata = () => {
    const fpath = path.resolve(this.config.src, 'metadata.yml')
    if (!fs.existsSync(fpath)) return

    set(this, 'metadata', new Yaml('metadata'))
    this.metadata.load(fpath)
  }

  loadMedia = () => {
    const fpath = path.resolve(this.config.src, 'media.yml')
    if (!fs.existsSync(fpath)) return

    let media = new Yaml('media')
    media.load(fpath)
    media = media.json()

    set(this, 'media', media)
  }

  loadTheme = () => {
    // Ensure themes dir exists unless running `new` command, as it's the
    // only command that's run outside of a project directory
    if (skipInitialization()) return

    const userThemesPath = path.resolve(this.config.themes_directory)

    fs.ensureDirSync(userThemesPath)

    // Add modules path that references the current b-ber project's theme dir
    module.paths.push(userThemesPath)

    const cwd = process.cwd()
    const cwdArr = cwd.split('/')
    const modulePaths = new Set([...module.paths])

    let cwdPath

    // Add modules paths that reference the current b-ber project
    do {
      cwdPath = `${cwdArr.join('/')}/node_modules`
      if (modulePaths.has(cwdPath)) continue

      module.paths.push(cwdPath)
    } while (cwdArr.pop())

    // Theme is set, using a built-in theme
    if (themes[this.config.theme]) {
      set(this, 'theme', themes[this.config.theme])
      log.info(`Loaded theme [${this.config.theme}]`)

      return
    }

    // Possibly a user defined theme, or one installed with npm
    try {
      // eslint-disable-next-line global-require, import/no-dynamic-require
      set(this, 'theme', require(this.config.theme))
      log.info(`Loaded theme [${this.config.theme}]`)
    } catch (err) {
      log.warn(`There was an error during require [${this.config.theme}]`)
      log.warn('Using default theme [b-ber-theme-serif]')
      log.warn(err.message)

      // Error loading theme, set to default
      set(this, 'theme', themes['b-ber-theme-serif'])
    }
  }

  loadAudioVideo = () => {
    if (skipInitialization()) return

    const mediaPath = path.resolve(this.config.src, '_media')
    fs.ensureDirSync(mediaPath)

    const media = fs.readdirSync(mediaPath)
    const video = media.filter(a => /^video/.test(mime.lookup(a)))
    const audio = media.filter(a => /^audio/.test(mime.lookup(a)))

    set(this, 'video', video)
    set(this, 'audio', audio)
  }

  loadBuildSettings = type => {
    if (skipInitialization()) return

    const { src, dist } = this.config
    const projectDir = path.resolve(src)

    if (!fs.existsSync(projectDir))
      log.error(`Project directory [${projectDir}] does not exist`)

    // One TOC to rule them all (toc.yml). A user can override the TOC for a
    // specific build by including a <type>.yml file, which will be loaded
    // instead of toc.yml below.
    const navigationConfigFileDefaultPath = path.resolve(src, 'toc.yml')
    const navigationConfigFilePath = path.resolve(src, `${type}.yml`)
    const navigationConfigFile = fs.existsSync(navigationConfigFilePath)
      ? navigationConfigFilePath
      : navigationConfigFileDefaultPath

    const spine = new Spine({ src, buildType: type, navigationConfigFile })

    // Build-specific config. gets merged into base config during build step
    const config = this.config[type] ? { ...this.config[type] } : {}

    return {
      src,
      dist: `${dist}-${type}`,
      config,
      guide: [],
      spine,
      toc: spine.nested,
      cursor: [],
      figures: [],
      footnotes: [],
      remoteAssets: [],
      loi: [],
    }
  }

  loadBuilds = () => {
    const builds = ['sample', 'epub', 'mobi', 'pdf', 'web', 'reader', 'xml']
    builds.forEach(build =>
      set(this.builds, build, this.loadBuildSettings(build))
    )
  }
}

export default new State()
