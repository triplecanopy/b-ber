// What the tasks read from the build they run in. Every task takes the
// build's context as its first argument and reads the project, the target and
// the config from it, never from `State` (TASK-165). Library code the tasks
// call still reads `State`, which routes to the same context while the build
// runs in it (TASK-163's shim), until TASK-173 removes it.

import path from 'node:path'
import type { BuildContext } from '@canopycanopycanopy/b-ber-lib'
import fs from 'fs-extra'

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

type PathFn = (...args: string[]) => string

// The project's source directory, config.yml's `src`
export const srcDir = (ctx: BuildContext): string => ctx.config.src as string

// The target's output directory, `<dist>-<target>`
export const distDir = (ctx: BuildContext): string => ctx.settings.dist

// The same directories `State`'s `src` and `dist` helpers give
export const src = (
  ctx: BuildContext
): Record<
  | 'root'
  | 'images'
  | 'markdown'
  | 'stylesheets'
  | 'javascripts'
  | 'fonts'
  | 'media',
  PathFn
> => {
  const root = srcDir(ctx)
  return {
    root: (...args) => path.join(root, ...args),
    images: (...args) => path.join(root, SRC_DIR_IMAGES, ...args),
    markdown: (...args) => path.join(root, SRC_DIR_MARKDOWN, ...args),
    stylesheets: (...args) => path.join(root, SRC_DIR_STYLESHEETS, ...args),
    javascripts: (...args) => path.join(root, SRC_DIR_JAVASCRIPTS, ...args),
    fonts: (...args) => path.join(root, SRC_DIR_FONTS, ...args),
    media: (...args) => path.join(root, SRC_DIR_MEDIA, ...args),
  }
}

export const dist = (
  ctx: BuildContext
): Record<
  | 'root'
  | 'ops'
  | 'text'
  | 'images'
  | 'stylesheets'
  | 'javascripts'
  | 'fonts'
  | 'media',
  PathFn
> => {
  const root = distDir(ctx)
  const ops = (...args: string[]) => path.join(root, DIST_DIR_OPS, ...args)
  return {
    root: (...args) => path.join(root, ...args),
    ops,
    text: (...args) => ops(DIST_DIR_TEXT, ...args),
    images: (...args) => ops(DIST_DIR_IMAGES, ...args),
    stylesheets: (...args) => ops(DIST_DIR_STYLESHEETS, ...args),
    javascripts: (...args) => ops(DIST_DIR_JAVASCRIPTS, ...args),
    fonts: (...args) => ops(DIST_DIR_FONTS, ...args),
    media: (...args) => ops(DIST_DIR_MEDIA, ...args),
  }
}

// `development` unless NODE_ENV says otherwise, as `state.env` was
export const env = (): string => process.env.NODE_ENV || 'development'

// b-ber-lib's version, which the OPF's generator and a generated cover print,
// as `state.version` read it
export const libVersion = (): string =>
  fs.readJSONSync(require.resolve('@canopycanopycanopy/b-ber-lib/package.json'))
    .version as string
