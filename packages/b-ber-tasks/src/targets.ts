// How each target builds: a plain async function per target, which reads top
// to bottom (TASK-160, TASK-165). They replace b-ber-shapes-sequences' lists of
// task names and `serialize`, which ran them.

import type {
  BuildContext,
  Spine,
  SpineItem,
  TargetName,
} from '@canopycanopycanopy/b-ber-lib'
import log from '@canopycanopycanopy/b-ber-logger'
import clean from './clean'
import container from './container'
import copy from './copy'
import cover from './cover'
import epub from './epub'
import footnotes from './footnotes'
import inject from './inject'
import loi from './loi'
import mobi from './mobi'
import mobiCSS from './mobi/mobi-css'
import opf from './opf'
import pdf from './pdf'
import reader from './reader'
import render from './render'
import sample from './sample'
import sass from './sass'
import scripts from './scripts'
import { step } from './step'
import web from './web'
import xml from './xml'

// The steps every target runs before packaging: an EPUB's OPS directory
const BOOK_STEPS = [
  'clean',
  'container',
  'cover',
  'sass',
  'copy',
  'scripts',
  'render',
  'loi',
  'footnotes',
  'inject',
  'opf',
] as const

// What the packaging steps read from the book's steps: the spine, as render,
// loi and footnotes extended it, the nested navigation, and the figure pages
interface Book {
  spine: Spine
  toc: SpineItem[]
  loi: SpineItem[]
}

async function book(ctx: BuildContext): Promise<Book> {
  await step(ctx, 'clean', () => clean(ctx))
  await step(ctx, 'container', () => container(ctx))
  await step(ctx, 'cover', () => cover(ctx))
  await step(ctx, 'sass', () => sass(ctx))
  await step(ctx, 'copy', () => copy(ctx))
  await step(ctx, 'scripts', () => scripts(ctx))
  const { spine, toc } = ctx.settings
  const pages = await step(ctx, 'render', () => render(ctx, { spine }))
  const figures = await step(ctx, 'loi', () =>
    loi(ctx, { figures: pages.figures, spine })
  )
  await step(ctx, 'footnotes', () =>
    footnotes(ctx, { footnotes: pages.footnotes, spine })
  )
  await step(ctx, 'inject', () => inject(ctx))
  await step(ctx, 'opf', () =>
    opf(ctx, {
      spine,
      toc,
      guide: [...pages.guide, ...figures.guide],
      loi: figures.pages,
      remoteAssets: pages.remoteAssets,
    })
  )

  return { spine, toc, loi: figures.pages }
}

interface TargetBuild {
  // The names of the steps `build` runs, in order. The logger counts them to
  // show a build's progress before it starts; a test checks that they match
  steps: readonly string[]
  build(ctx: BuildContext): Promise<void>
}

const packaged = (
  name: string,
  pack: (ctx: BuildContext, book: Book) => Promise<unknown>
): TargetBuild => ({
  steps: [...BOOK_STEPS, name],
  async build(ctx) {
    const pages = await book(ctx)
    await step(ctx, name, () => pack(ctx, pages))
  },
})

// In the order `bber build` alone builds them
const builds: Record<TargetName, TargetBuild> = {
  epub: packaged('epub', (ctx) => epub(ctx)),
  mobi: {
    steps: [...BOOK_STEPS, 'mobiCSS', 'mobi'],
    async build(ctx) {
      await book(ctx)
      await step(ctx, 'mobiCSS', () => mobiCSS(ctx))
      await step(ctx, 'mobi', () => mobi(ctx))
    },
  },
  pdf: packaged('pdf', (ctx) => pdf(ctx)),
  web: packaged('web', (ctx, { spine, loi, toc }) =>
    web(ctx, { spine, loi, toc })
  ),
  sample: packaged('sample', (ctx) => sample(ctx)),
  reader: packaged('reader', (ctx) => reader(ctx)),
  xml: packaged('xml', (ctx, { spine, loi }) => xml(ctx, { spine, loi })),
}

// Every target, in the order `bber build` alone builds them
export const targetNames = Object.keys(builds) as TargetName[]

// The steps a target's build runs, for the logger's plan
export const targetSteps = (name: TargetName): readonly string[] =>
  builds[name].steps

// Builds the context's target. A failure is reported once and rethrown; on
// success the logger's `done` event carries what its summary prints
export async function build(ctx: BuildContext): Promise<void> {
  try {
    await builds[ctx.target.name].build(ctx)
    log.notify('done', {
      state: {
        build: ctx.target.name,
        config: ctx.config,
        metadata: ctx.project.metadata,
        toc: ctx.settings.toc,
      },
    })
  } catch (err) {
    throw log.error(err)
  }
}
