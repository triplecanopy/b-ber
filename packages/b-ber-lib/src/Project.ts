/* eslint-disable global-require, import/no-dynamic-require */

// Reading a project from disk, explicitly. `State` used to do all of this in
// its constructor, when it was imported. These functions are the one
// implementation: `State` calls them when it loads itself, and `loadProject`
// calls them for a build (TASK-163).

import crypto from 'node:crypto'
import path from 'node:path'
import log from '@canopycanopycanopy/b-ber-logger'
import fs from 'fs-extra'
import mime from 'mime-types'
import Config, { type ConfigOptions } from './Config'
import Spine from './Spine'
import type { BuildSettings, MediaEntry, ThemeModule } from './State'
import { builtInThemes } from './themes'
import Yaml, { type MetadataEntry } from './Yaml'

export type Metadata = Yaml<MetadataEntry[]>
export type MediaMap = Record<string, Record<string, MediaEntry>>

export const randomHash = (): string => crypto.randomBytes(20).toString('hex')

// A stand-in until a project's metadata.yml is read; it mocks the YAML API
export const emptyMetadata = (): Metadata =>
  ({ json: () => [{}] }) as unknown as Metadata

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' &&
  value !== null &&
  !Array.isArray(value) &&
  Object.getPrototypeOf(value) === Object.prototype

// Layers `override` onto `base`. Objects merge key by key; anything else,
// arrays included, replaces. lodash's `merge` and `defaultsDeep` merge arrays
// by index, so a short list would be padded with the base's entries
// (TASK-162, audit bug 3). An `undefined` in `override` leaves `base` as it is.
export function mergeConfig<T extends Record<string, unknown>>(
  base: T,
  override: Record<string, unknown> = {}
): T {
  const result: Record<string, unknown> = { ...base }
  for (const [key, value] of Object.entries(override)) {
    if (value === undefined) continue
    result[key] =
      isPlainObject(value) && isPlainObject(result[key])
        ? mergeConfig(result[key] as Record<string, unknown>, value)
        : value
  }
  return result as T
}

// config.yml over the defaults, without any override. A project with no
// config.yml gets the defaults
export function readConfig(root: string = process.cwd()): ConfigOptions {
  const file = path.join(root, 'config.yml')
  if (!fs.existsSync(file)) return new Config() as unknown as ConfigOptions

  const config = new Yaml<Partial<ConfigOptions>>('config')
  config.load(file)
  return new Config(config.json()) as unknown as ConfigOptions
}

// The config one target builds with: defaults ← config.yml ← config.yml's
// `<target>:` section ← the overrides (a --config file, then CLI flags)
export function resolveConfig(
  config: ConfigOptions,
  target: string,
  overrides: Record<string, unknown> = {}
): ConfigOptions {
  const section = isPlainObject(config[target]) ? config[target] : {}
  return mergeConfig(mergeConfig(config, section), overrides)
}

export function readMetadata(src: string): Metadata {
  const file = path.resolve(src, 'metadata.yml')
  if (!fs.existsSync(file)) return emptyMetadata()

  const metadata: Metadata = new Yaml<MetadataEntry[]>('metadata')
  metadata.load(file)
  return metadata
}

export function readMedia(src: string): MediaMap {
  const file = path.resolve(src, 'media.yml')
  if (!fs.existsSync(file)) return {}

  const media = new Yaml<MediaMap>('media')
  media.load(file)
  return media.json()
}

// The audio and video files in `_media`. Creates the directory if it is
// missing, as State always has; TASK-170 stops builds writing to the source
export function readAudioVideo(src: string): {
  audio: string[]
  video: string[]
} {
  const mediaPath = path.resolve(src, '_media')
  fs.ensureDirSync(mediaPath)

  const files = fs.readdirSync(mediaPath)
  const of = (kind: RegExp) =>
    files.filter((a) => kind.test(mime.lookup(a) as string))
  return { video: of(/^video/), audio: of(/^audio/) }
}

// The project's theme: a built-in one, or one `require`d from the project's
// themes directory or node_modules, falling back to b-ber-theme-serif
export function readTheme(config: ConfigOptions): ThemeModule {
  const themes = builtInThemes()
  const userThemesPath = path.resolve(config.themes_directory as string)

  fs.ensureDirSync(userThemesPath)

  // Add modules path that references the current b-ber project's theme dir
  module.paths.push(userThemesPath)

  const cwdArr = process.cwd().split('/')
  const modulePaths = new Set([...module.paths])

  // Add modules paths that reference the current b-ber project
  do {
    const cwdPath = `${cwdArr.join('/')}/node_modules`
    if (modulePaths.has(cwdPath)) continue
    module.paths.push(cwdPath)
  } while (cwdArr.pop())

  const themeName = config.theme as string

  if (themes[themeName]) {
    log.info(`Loaded theme [${themeName}]`)
    return themes[themeName]
  }

  // Possibly a user defined theme, or one installed with npm
  try {
    const theme = require(themeName) as ThemeModule
    log.info(`Loaded theme [${themeName}]`)
    return theme
  } catch (err) {
    log.warn(`There was an error during require [${themeName}]`)
    log.warn('Using default theme [b-ber-theme-serif]')
    log.warn((err as Error).message)
    return themes['b-ber-theme-serif']
  }
}

// One target's settings and the collections its tasks fill
export function readBuildSettings(
  config: ConfigOptions,
  type: string
): BuildSettings {
  const src = config.src as string
  const dist = config.dist as string
  const projectDir = path.resolve(src)

  if (!fs.existsSync(projectDir))
    throw log.error(`Project directory [${projectDir}] does not exist`)

  // One TOC to rule them all (toc.yml). A user can override the TOC for a
  // specific build by including a <type>.yml file, which will be loaded
  // instead of toc.yml below.
  const navigationConfigFileDefaultPath = path.resolve(src, 'toc.yml')
  const navigationConfigFilePath = path.resolve(src, `${type}.yml`)
  const navigationConfigFile = fs.existsSync(navigationConfigFilePath)
    ? navigationConfigFilePath
    : navigationConfigFileDefaultPath

  const buildDist = `${dist}-${type}`
  const spine = new Spine({ src, dist: buildDist, navigationConfigFile })

  // The build's own section of config.yml. `resolveConfig` merges it; it is
  // kept here as well, as it always has been
  const section = config[type]
    ? { ...(config[type] as Record<string, unknown>) }
    : {}

  return {
    src,
    dist: buildDist,
    config: section,
    guide: [],
    spine,
    toc: spine.nested,
    figures: [],
    footnotes: [],
    remoteAssets: [],
    loi: [],
  }
}

// What a build reads from the project, read once, explicitly
export interface Project {
  root: string
  // config.yml over the defaults, before any override
  config: ConfigOptions
  // The --config file and CLI flags, which win over config.yml and its
  // target sections
  overrides: Record<string, unknown>
  metadata: Metadata
  media: MediaMap
  theme: ThemeModule
  audio: string[]
  video: string[]
}

// Reads a project. The overrides apply before anything is read, so a flag
// that names a directory or a theme takes effect (TASK-162, audit bug 1).
// Paths in the config stay relative to the working directory, as they always
// have; `root` locates config.yml.
//
// The source directory, the theme and the themes directory come from
// config.yml and the overrides only: a target's section can't change them,
// because the project is read once for every target
export function loadProject(
  root: string = process.cwd(),
  overrides: Record<string, unknown> = {}
): Project {
  const config = readConfig(root)
  const shared = mergeConfig(config, overrides)
  const src = shared.src as string

  return {
    root,
    config,
    overrides,
    metadata: readMetadata(src),
    media: readMedia(src),
    theme: readTheme(shared),
    ...readAudioVideo(src),
  }
}
