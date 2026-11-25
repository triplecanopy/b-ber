// What each output format is and what it supports (TASK-160, TASK-164).
// Rendering branches on a target's `features`, never on its name: a check in
// `npm test` (`scripts/check-target-names.js`) fails on a comparison with a
// target's name in grammar, parser or template code. The features are
// internal; config.yml cannot set them.
//
// The names themselves are public and frozen. A project sees them in four
// places: the `<target>:` section of config.yml, the keys of media.yml, the
// themes' SCSS `$build`, and `window.bber.env`.

export type TargetName =
  | 'epub'
  | 'mobi'
  | 'pdf'
  | 'web'
  | 'reader'
  | 'sample'
  | 'xml'

export interface TargetFeatures {
  // Inline iframe and Vimeo embeds render live, and audio and video may take
  // custom controls. Everything else gets the "unsupported" fallback, and
  // `controls="controls"`, which EPUBCheck requires
  liveEmbeds: boolean
  // Gallery and spread open as positioned full-screen containers rather than
  // a plain <section>
  fullbleedContainers: boolean
  // Where a figure's full page lives: one page per figure, or every figure on
  // a single `figures-titlepage.xhtml`
  figuresOn: 'page' | 'titlepage'
  // The markup b-ber-reader-react hydrates: no poster <img> on Vimeo embeds,
  // which the reader takes from `data-vimeo-poster`, and the empty <div> its
  // spread markers need
  readerRuntime: boolean
  // Non-linear spine items are kept. Kindle drops them
  nonLinearSpine: boolean
  // The build writes a cover page. pdf's cover comes from its config.yml
  coverPage: boolean
}

// Which of b-ber-templates' figure template tables a target's figure pages
// use. Named rather than held as the table, because b-ber-templates depends on
// this package
export type FigureTemplateSet = 'epub' | 'mobi' | 'reader' | 'web'

export interface Target {
  name: TargetName
  features: TargetFeatures
  figureTemplates: FigureTemplateSet
}

// The defaults every target starts from: an EPUB reading system's
const BOOK: TargetFeatures = {
  liveEmbeds: false,
  fullbleedContainers: false,
  figuresOn: 'page',
  readerRuntime: false,
  nonLinearSpine: true,
  coverPage: true,
}

const BROWSER: TargetFeatures = {
  ...BOOK,
  liveEmbeds: true,
  fullbleedContainers: true,
}

// pdf, sample and xml name the epub figure templates explicitly. They used to
// reach them by falling back on any target the table did not list
export const targets: Readonly<Record<TargetName, Target>> = {
  epub: { name: 'epub', features: BOOK, figureTemplates: 'epub' },
  mobi: {
    name: 'mobi',
    features: { ...BOOK, nonLinearSpine: false },
    figureTemplates: 'mobi',
  },
  pdf: {
    name: 'pdf',
    features: { ...BOOK, coverPage: false },
    figureTemplates: 'epub',
  },
  web: { name: 'web', features: BROWSER, figureTemplates: 'web' },
  reader: {
    name: 'reader',
    features: { ...BROWSER, figuresOn: 'titlepage', readerRuntime: true },
    figureTemplates: 'reader',
  },
  sample: { name: 'sample', features: BOOK, figureTemplates: 'epub' },
  xml: { name: 'xml', features: BOOK, figureTemplates: 'epub' },
}

export const isTargetName = (name: unknown): name is TargetName =>
  typeof name === 'string' && Object.hasOwn(targets, name)

export function getTarget(name: string): Target {
  if (!isTargetName(name)) {
    throw new Error(
      `Unknown target [${name}]. Expected one of ${Object.keys(targets).join(', ')}`
    )
  }
  return targets[name]
}
