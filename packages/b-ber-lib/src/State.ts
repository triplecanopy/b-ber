/* eslint-disable no-continue */

import path from 'node:path'
import log from '@canopycanopycanopy/b-ber-logger'
import fs from 'fs-extra'
import find from 'lodash/find'
import findIndex from 'lodash/findIndex'
import get from 'lodash/get'
import has from 'lodash/has'
import merge from 'lodash/merge'
import remove from 'lodash/remove'
import set from 'lodash/set'
import { type BuildContext, currentBuildContext } from './BuildContext'
import Config, { type ConfigOptions } from './Config'
import type GuideItem from './GuideItem'
import {
  emptyMetadata,
  randomHash,
  readAudioVideo,
  readBuildSettings,
  readConfig,
  readMedia,
  readMetadata,
  readTheme,
  resolveConfig,
} from './Project'
import type Spine from './Spine'
import type SpineItem from './SpineItem'
import { getTarget, type Target } from './Target'
import type Yaml from './Yaml'
import type { MetadataEntry } from './Yaml'

// What a theme package exports, whether built in or a user's theme loaded with
// `require`
export interface ThemeModule {
  name: string
  // Path of the theme's SCSS entry point
  entry: string
  // File names in the theme's `fonts` and `images` directories
  fonts: string[]
  images: string[]
  npmPackage?: unknown
}

// One entry of media.yml, which maps a media ID to a directive for each build
export interface MediaEntry {
  // The directive the `media` directive is replaced with, e.g. `vimeo`
  type: string
  caption?: string
  // The replacement directive's attributes
  [attribute: string]: unknown
}

// What b-ber-grammar-renderer records for each open block directive
export interface CursorEntry {
  id: string
  type: string
}

// The rendered footnotes of one file, from b-ber-grammar-footnotes
export interface FootnotesEntry {
  fileName: string
  title: string
  notes: string
}

// The fields that belong to one build, or to the project a build reads. While
// a build runs in a BuildContext they read and write the context instead of
// the instance (the TASK-160 shim; TASK-163)
const ROUTED = [
  'build',
  'config',
  'hash',
  'sequence',
  'builds',
  'metadata',
  'media',
  'theme',
  'video',
  'audio',
] as const
type Routed = (typeof ROUTED)[number]

// Outside a build, each of these loads its part of the project on first use,
// and only that part (the config first, which the others read). `State` used
// to load all of it in its constructor, when it was imported. Loading one part
// at a time matters: a module that reads an option from `state.config` when it
// is imported must not read the whole project from the working directory
type Part = 'config' | 'metadata' | 'media' | 'audioVideo' | 'builds' | 'theme'
const PART_OF: Partial<Record<Routed, Part>> = {
  config: 'config',
  metadata: 'metadata',
  media: 'media',
  video: 'audioVideo',
  audio: 'audioVideo',
  builds: 'builds',
  theme: 'theme',
}

// `builds` keyed by the context's target. One object per context, because
// callers mutate it (`state.builds[state.build].spine = …`)
const contextBuilds = new WeakMap<BuildContext, Record<string, BuildSettings>>()
const buildsOf = (context: BuildContext): Record<string, BuildSettings> => {
  let builds = contextBuilds.get(context)
  if (!builds) {
    builds = Object.defineProperty({}, context.target.name, {
      enumerable: true,
      get: () => context.settings,
      set: (settings: BuildSettings) => {
        // eslint-disable-next-line no-param-reassign
        context.settings = settings
      },
    }) as Record<string, BuildSettings>
    contextBuilds.set(context, builds)
  }
  return builds
}

const readFromContext = (context: BuildContext, key: Routed): unknown => {
  switch (key) {
    case 'build':
      return context.target.name
    case 'config':
      return context.config
    case 'hash':
      return context.hash
    case 'sequence':
      return context.sequence
    case 'builds':
      return buildsOf(context)
    default:
      return context.project[key]
  }
}

/* eslint-disable no-param-reassign */
const writeToContext = (
  context: BuildContext,
  key: Routed,
  value: unknown
): void => {
  switch (key) {
    case 'build':
      context.target = getTarget(value as string)
      return
    case 'config':
      context.config = value as ConfigOptions
      return
    case 'hash':
      context.hash = value as string
      return
    case 'sequence':
      context.sequence = value as unknown[]
      return
    case 'builds': {
      const settings = (value as Record<string, BuildSettings>)[
        context.target.name
      ]
      if (settings) context.settings = settings
      return
    }
    default:
      ;(context.project as unknown as Record<string, unknown>)[key] = value
  }
}
/* eslint-enable no-param-reassign */

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

// One build's settings and the collections its tasks fill, from
// `loadBuildSettings`. The getters below read and write the current build's.
export interface BuildSettings {
  src: string
  dist: string
  // The build's section of config.yml, merged over the base config later
  config: Record<string, unknown>
  guide: GuideItem[]
  spine: Spine
  // The nested navigation, `spine.nested`
  toc: SpineItem[]
  cursor: CursorEntry[]
  // b-ber-templates' FigureData. Not typed here because b-ber-templates
  // depends on this package
  figures: unknown[]
  footnotes: FootnotesEntry[]
  // URLs of media the project embeds from elsewhere
  remoteAssets: string[]
  // The pages b-ber-tasks' `loi` task generates for each figure
  loi: SpineItem[]
}

class State {
  static get defaults(): { build: string; sequence: unknown[]; hash: string } {
    return {
      build: 'epub',
      sequence: [],
      hash: randomHash(),
    }
  }

  metadata: Yaml<MetadataEntry[]> = emptyMetadata() // mocks the YAML api

  // Empty until `loadTheme` runs, which it does not for `new`, `--help` and
  // `--version`
  theme: ThemeModule = {} as ThemeModule

  video: string[] = []

  audio: string[] = []

  // media.yml: media ID -> build type -> replacement directive
  media: Record<string, Record<string, MediaEntry>> = {}

  build = 'epub'

  sequence: unknown[] = []

  hash: string = randomHash()

  // Empty placeholders until `loadBuilds` replaces each with
  // `loadBuildSettings`' result. Typed as complete because every build task
  // runs after `loadBuilds`; only `new`, `--help` and `--version`, which skip
  // initialization and read no build settings, see anything else
  builds: Record<string, BuildSettings> = {
    sample: {},
    epub: {},
    mobi: {},
    pdf: {},
    web: {},
    reader: {},
  } as unknown as Record<string, BuildSettings>

  config!: ConfigOptions

  private loadedParts = new Set<Part>()

  private loadingParts = new Set<Part>()

  private versionCache?: string

  // b-ber-lib's own version, read when first asked for
  get version(): string {
    if (this.versionCache) return this.versionCache

    // for testing, since our directory structure is different in dist
    try {
      ;({ version: this.versionCache } = fs.readJSONSync(
        require.resolve('./package.json')
      ))
    } catch (err) {
      ;({ version: this.versionCache } = fs.readJSONSync(
        require.resolve('../package.json')
      ))
    }
    return this.versionCache as string
  }

  get spine(): Spine {
    return this.builds[this.build].spine
  }

  set spine(val: Spine) {
    this.builds[this.build].spine = val
  }

  get guide(): GuideItem[] {
    return this.builds[this.build].guide
  }

  set guide(val: GuideItem[]) {
    this.builds[this.build].guide = val
  }

  get figures(): unknown[] {
    return this.builds[this.build].figures
  }

  set figures(val: unknown[]) {
    this.builds[this.build].figures = val
  }

  get footnotes(): FootnotesEntry[] {
    return this.builds[this.build].footnotes
  }

  set footnotes(val: FootnotesEntry[]) {
    this.builds[this.build].footnotes = val
  }

  get cursor(): CursorEntry[] {
    return this.builds[this.build].cursor
  }

  set cursor(val: CursorEntry[]) {
    this.builds[this.build].cursor = val
  }

  // The nested navigation, `spine.nested`
  get toc(): SpineItem[] {
    return this.builds[this.build].toc
  }

  set toc(val: SpineItem[]) {
    this.builds[this.build].toc = val
  }

  get remoteAssets(): string[] {
    return this.builds[this.build].remoteAssets
  }

  set remoteAssets(val: string[]) {
    this.builds[this.build].remoteAssets = val
  }

  get loi(): SpineItem[] {
    return this.builds[this.build].loi
  }

  set loi(val: SpineItem[]) {
    this.builds[this.build].loi = val
  }

  // The target being built: what grammar, parser and template code branches
  // on, through its `features`. Read-only; `build` names it
  get target(): Target {
    return currentBuildContext()?.target ?? getTarget(this.build)
  }

  get srcDir(): string {
    return this.config.src as string
  }

  set srcDir(val: string) {
    this.config.src = val
  }

  get distDir(): string {
    if (this.build && this.builds && this.builds[this.build]) {
      return this.builds[this.build].dist
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

  // Reads nothing. Each part of the project is loaded on first use
  // (`loadPart`), or a build runs in a BuildContext and the routed fields
  // read that instead
  constructor() {
    const self = this as unknown as Record<string, unknown>
    const local: Record<string, unknown> = {}

    for (const key of ROUTED) {
      local[key] = self[key]
      Object.defineProperty(this, key, {
        configurable: true,
        enumerable: true,
        get: () => {
          const context = currentBuildContext()
          if (context) return readFromContext(context, key)
          const part = PART_OF[key]
          if (part) this.loadPart(part)
          return local[key]
        },
        set: (value: unknown) => {
          const context = currentBuildContext()
          if (context) {
            writeToContext(context, key, value)
            return
          }
          // Load first, so that the value set is not then replaced by the
          // project's, the order it happened in when State loaded on import
          const part = PART_OF[key]
          if (part) this.loadPart(part)
          local[key] = value
        },
      })
    }
  }

  // Loads one part of the project from the working directory, once. Together
  // the parts are what the constructor loaded before TASK-163
  private loadPart = (part: Part): void => {
    if (this.loadedParts.has(part) || this.loadingParts.has(part)) return
    this.loadingParts.add(part)
    try {
      if (part === 'config') {
        // Not `reset()`, as the constructor called: the fields' initialisers
        // already hold its defaults, and resetting on first use would discard
        // what was set before it (a `sequence`)
        set(this, 'config', new Config())
        this.loadConfig()
      } else {
        this.loadPart('config')
        const loaders: Record<Exclude<Part, 'config'>, () => void> = {
          metadata: this.loadMetadata,
          media: this.loadMedia,
          audioVideo: this.loadAudioVideo,
          builds: this.loadBuilds,
          theme: this.loadTheme,
        }
        loaders[part]()
      }
    } finally {
      this.loadingParts.delete(part)
      this.loadedParts.add(part)
    }
  }

  // In a build, gives the build a new hash and re-resolves its config from
  // the project. It never changes which target is building
  reset = (): void => {
    const context = currentBuildContext()
    if (context) {
      context.hash = randomHash()
      context.sequence = []
      context.config = resolveConfig(
        context.project.config,
        context.target.name,
        context.project.overrides
      )
      return
    }

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
      throw log.error(`Cannot add [${value}] to [state.${prop}]`)
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
      throw log.error(`Cannot remove [${value}] from [state.${prop}]`)
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

  // `value` and `pred` are lodash `matches` shorthands, e.g. `{ id }`
  contains = (coll: string, value: object): boolean =>
    this.indexOf(coll, value) > -1

  find = (coll: string, pred: object): unknown => {
    const collection = get(this, coll)
    return find(collection, pred)
  }

  indexOf = (coll: string, pred: object): number => {
    const collection = get(this, coll)
    return findIndex(collection, pred)
  }

  // Each loader keeps its old guard: a missing file leaves the field as it
  // is. The reading itself is in Project.ts, shared with `loadProject`
  loadConfig = (): void => {
    if (!fs.existsSync(path.resolve('config.yml'))) return
    set(this, 'config', readConfig())
  }

  loadMetadata = (): void => {
    const fpath = path.resolve(this.config.src as string, 'metadata.yml')
    if (!fs.existsSync(fpath)) return
    set(this, 'metadata', readMetadata(this.config.src as string))
  }

  loadMedia = (): void => {
    const fpath = path.resolve(this.config.src as string, 'media.yml')
    if (!fs.existsSync(fpath)) return
    set(this, 'media', readMedia(this.config.src as string))
  }

  loadTheme = (): void => {
    // Ensure themes dir exists unless running `new` command, as it's the
    // only command that's run outside of a project directory
    if (skipInitialization()) return
    set(this, 'theme', readTheme(this.config))
  }

  loadAudioVideo = (): void => {
    if (skipInitialization()) return
    const { audio, video } = readAudioVideo(this.config.src as string)
    set(this, 'video', video)
    set(this, 'audio', audio)
  }

  loadBuildSettings = (type: string): BuildSettings | undefined => {
    if (skipInitialization()) return undefined
    return readBuildSettings(this.config, type)
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
