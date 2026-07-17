/* eslint-disable no-continue */

import log from '@canopycanopycanopy/b-ber-logger'
import crypto from 'crypto'
import fs from 'fs-extra'
import find from 'lodash/find'
import findIndex from 'lodash/findIndex'
import get from 'lodash/get'
import has from 'lodash/has'
import merge from 'lodash/merge'
import remove from 'lodash/remove'
import set from 'lodash/set'
import mime from 'mime-types'
import path from 'path'
import Config, { ConfigOptions } from './Config'
import Spine from './Spine'
import Yaml from './Yaml'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ThemeModule = any

const themes: Record<string, ThemeModule> = {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  'b-ber-theme-serif': require('@canopycanopycanopy/b-ber-theme-serif'),
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  'b-ber-theme-sans': require('@canopycanopycanopy/b-ber-theme-sans'),
}

const randomHash = (): string => crypto.randomBytes(20).toString('hex')

const skipInitialization = (): boolean => {
  const { argv } = process

  // prettier-ignore
  return (
    argv.includes('--help') || // if a help flag is set
    argv.includes('-h') || // if a help alias is set
    argv.includes('--version') || // if printing the version; no project to load
    argv.includes('-v') || // if the version alias is set
    argv.length < 3 || // if there are insufficient arguments
    argv.includes('new') // if it's a new project
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

// TODO: type this — build settings are populated dynamically via loadBuildSettings
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type BuildSettings = Record<string, any>

class State {
  static get defaults(): { build: string; sequence: unknown[]; hash: string } {
    return {
      build: 'epub',
      sequence: [],
      hash: randomHash(),
    }
  }

  metadata: Yaml = { json: () => [{}] } as unknown as Yaml // mocks the YAML api

  theme: ThemeModule = {}

  video: string[] = []

  audio: string[] = []

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  media: any = {}

  build = 'epub'

  sequence: unknown[] = []

  hash: string = randomHash()

  builds: Record<string, BuildSettings> = {
    sample: {},
    epub: {},
    mobi: {},
    pdf: {},
    web: {},
    reader: {},
  }

  config!: ConfigOptions

  version!: string

  get spine(): Spine {
    return this.builds[this.build].spine
  }

  set spine(val: Spine) {
    this.builds[this.build].spine = val
  }

  get guide(): unknown[] {
    return this.builds[this.build].guide
  }

  set guide(val: unknown[]) {
    this.builds[this.build].guide = val
  }

  get figures(): unknown[] {
    return this.builds[this.build].figures
  }

  set figures(val: unknown[]) {
    this.builds[this.build].figures = val
  }

  get footnotes(): unknown[] {
    return this.builds[this.build].footnotes
  }

  set footnotes(val: unknown[]) {
    this.builds[this.build].footnotes = val
  }

  get cursor(): unknown[] {
    return this.builds[this.build].cursor
  }

  set cursor(val: unknown[]) {
    this.builds[this.build].cursor = val
  }

  get toc(): unknown[] {
    return this.builds[this.build].toc
  }

  set toc(val: unknown[]) {
    this.builds[this.build].toc = val
  }

  get remoteAssets(): unknown[] {
    return this.builds[this.build].remoteAssets
  }

  set remoteAssets(val: unknown[]) {
    this.builds[this.build].remoteAssets = val
  }

  get loi(): unknown[] {
    return this.builds[this.build].loi
  }

  set loi(val: unknown[]) {
    this.builds[this.build].loi = val
  }

  get srcDir(): string {
    return this.config.src as string
  }

  set srcDir(val: string) {
    this.config.src = val
  }

  get distDir(): string {
    if (this.build && this.builds && this.builds[this.build]) {
      return this.builds[this.build].dist as string
    }
    return this.config.dist as string
  }

  set distDir(val: string) {
    this.config.dist = val
  }

  // eslint-disable-next-line class-methods-use-this
  get env(): string {
    return process.env.NODE_ENV || 'development'
  }

  set env(val: string) {
    this.config.env = val
  }

  src = {
    root: (...args: string[]): string => path.join(this.srcDir, ...args),
    images: (...args: string[]): string =>
      path.join(this.srcDir, SRC_DIR_IMAGES, ...args),
    markdown: (...args: string[]): string =>
      path.join(this.srcDir, SRC_DIR_MARKDOWN, ...args),
    stylesheets: (...args: string[]): string =>
      path.join(this.srcDir, SRC_DIR_STYLESHEETS, ...args),
    javascripts: (...args: string[]): string =>
      path.join(this.srcDir, SRC_DIR_JAVASCRIPTS, ...args),
    fonts: (...args: string[]): string =>
      path.join(this.srcDir, SRC_DIR_FONTS, ...args),
    media: (...args: string[]): string =>
      path.join(this.srcDir, SRC_DIR_MEDIA, ...args),
  }

  dist = {
    root: (...args: string[]): string => path.join(this.distDir, ...args),
    ops: (...args: string[]): string =>
      path.join(this.distDir, DIST_DIR_OPS, ...args),
    text: (...args: string[]): string =>
      path.join(this.distDir, DIST_DIR_OPS, DIST_DIR_TEXT, ...args),
    images: (...args: string[]): string =>
      path.join(this.distDir, DIST_DIR_OPS, DIST_DIR_IMAGES, ...args),
    stylesheets: (...args: string[]): string =>
      path.join(this.distDir, DIST_DIR_OPS, DIST_DIR_STYLESHEETS, ...args),
    javascripts: (...args: string[]): string =>
      path.join(this.distDir, DIST_DIR_OPS, DIST_DIR_JAVASCRIPTS, ...args),
    fonts: (...args: string[]): string =>
      path.join(this.distDir, DIST_DIR_OPS, DIST_DIR_FONTS, ...args),
    media: (...args: string[]): string =>
      path.join(this.distDir, DIST_DIR_OPS, DIST_DIR_MEDIA, ...args),
  }

  constructor() {
    let version: string

    // for testing, since our directory structure is different in dist
    try {
      ;({ version } = fs.readJSONSync(require.resolve('./package.json')))
    } catch (err) {
      ;({ version } = fs.readJSONSync(require.resolve('../package.json')))
    }

    set(this, 'version', version!)
    set(this, 'config', new Config())

    this.reset()
    this.loadMetadata()
    this.loadAudioVideo()
    this.loadMedia()
    this.loadBuilds()
    this.loadTheme()
  }

  reset = (): void => {
    Object.entries(State.defaults).forEach(([key, val]) => set(this, key, val))
    this.loadConfig()
  }

  add = (prop: string, value: unknown): void => {
    const prevValue = get(this, prop)

    if (Array.isArray(prevValue)) {
      set(this, prop, [...prevValue, value])
    } else if (
      typeof prevValue === 'object' &&
      prevValue !== null &&
      !Array.isArray(prevValue)
    ) {
      set(this, prop, { ...(prevValue as Record<string, unknown>), value })
    } else if (typeof prevValue === 'string') {
      set(this, prop, `${prevValue}${value}`)
    } else {
      log.error(`Cannot add [${value}] to [state.${prop}]`)
    }
  }

  remove = (prop: string, value: unknown): void => {
    const prevValue = get(this, prop)

    if (Array.isArray(prevValue)) {
      const arr = [...prevValue]
      remove(arr, value as Parameters<typeof remove>[1])
      set(this, prop, arr)
    } else if (
      typeof prevValue === 'object' &&
      prevValue !== null &&
      !Array.isArray(prevValue)
    ) {
      const key = value as string
      const { [key]: _, ...rest } = prevValue as Record<string, unknown> // eslint-disable-line no-unused-vars
      set(this, prop, rest)
    } else {
      log.error(`Cannot remove [${value}] from [state.${prop}]`)
    }
  }

  merge = (prop: string, value: unknown): void => {
    const oldValue = get(this, prop)
    set(this, prop, merge(oldValue, value))
  }

  update = (prop: string, val: unknown): void => {
    set(this, prop, val)
  }

  has = (prop: string): boolean => {
    return has(this, prop)
  }

  contains = (coll: string, value: unknown): boolean =>
    this.indexOf(coll, value) > -1

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  find = (coll: string, pred: any): unknown => {
    const collection = get(this, coll)
    return find(collection, pred)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  indexOf = (coll: string, pred: any): number => {
    const collection = get(this, coll)
    return findIndex(collection, pred)
  }

  loadConfig = (): void => {
    if (!fs.existsSync(path.resolve('config.yml'))) return

    const config = new Yaml('config')
    config.load(path.resolve('config.yml'))

    // not necessary right now to pass around a YAWN instance since we'er
    // not writing back to config.yml, but may be necessary at some point
    set(this, 'config', new Config(config.json() as Partial<ConfigOptions>))
  }

  loadMetadata = (): void => {
    const fpath = path.resolve(this.config.src as string, 'metadata.yml')
    if (!fs.existsSync(fpath)) return

    set(this, 'metadata', new Yaml('metadata'))
    this.metadata.load(fpath)
  }

  loadMedia = (): void => {
    const fpath = path.resolve(this.config.src as string, 'media.yml')
    if (!fs.existsSync(fpath)) return

    const mediaYaml = new Yaml('media')
    mediaYaml.load(fpath)
    const media = mediaYaml.json()

    set(this, 'media', media)
  }

  loadTheme = (): void => {
    // Ensure themes dir exists unless running `new` command, as it's the
    // only command that's run outside of a project directory
    if (skipInitialization()) return

    const userThemesPath = path.resolve(this.config.themes_directory as string)

    fs.ensureDirSync(userThemesPath)

    // Add modules path that references the current b-ber project's theme dir
    module.paths.push(userThemesPath)

    const cwd = process.cwd()
    const cwdArr = cwd.split('/')
    const modulePaths = new Set([...module.paths])

    let cwdPath: string

    // Add modules paths that reference the current b-ber project
    do {
      cwdPath = `${cwdArr.join('/')}/node_modules`
      if (modulePaths.has(cwdPath)) continue

      module.paths.push(cwdPath)
    } while (cwdArr.pop())

    const themeName = this.config.theme as string

    // Theme is set, using a built-in theme
    if (themes[themeName]) {
      set(this, 'theme', themes[themeName])
      log.info(`Loaded theme [${themeName}]`)

      return
    }

    // Possibly a user defined theme, or one installed with npm
    try {
      // eslint-disable-next-line global-require, import/no-dynamic-require
      set(this, 'theme', require(themeName))
      log.info(`Loaded theme [${themeName}]`)
    } catch (err) {
      log.warn(`There was an error during require [${themeName}]`)
      log.warn('Using default theme [b-ber-theme-serif]')
      log.warn((err as Error).message)

      // Error loading theme, set to default
      set(this, 'theme', themes['b-ber-theme-serif'])
    }
  }

  loadAudioVideo = (): void => {
    if (skipInitialization()) return

    const mediaPath = path.resolve(this.config.src as string, '_media')
    fs.ensureDirSync(mediaPath)

    const media = fs.readdirSync(mediaPath)
    const video = media.filter((a) => /^video/.test(mime.lookup(a) as string))
    const audio = media.filter((a) => /^audio/.test(mime.lookup(a) as string))

    set(this, 'video', video)
    set(this, 'audio', audio)
  }

  loadBuildSettings = (type: string): BuildSettings | undefined => {
    if (skipInitialization()) return undefined

    const src = this.config.src as string
    const dist = this.config.dist as string
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
    const config = this.config[type]
      ? { ...(this.config[type] as Record<string, unknown>) }
      : {}

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

  loadBuilds = (): void => {
    const builds = ['sample', 'epub', 'mobi', 'pdf', 'web', 'reader', 'xml']
    builds.forEach((build) =>
      set(this.builds, build, this.loadBuildSettings(build))
    )
  }
}

export type { State as StateClass }
export default new State()
