import path from 'node:path'
import markdownItAudioVideo from '@canopycanopycanopy/b-ber-grammar-audio-video'
import markdownItDialogue from '@canopycanopycanopy/b-ber-grammar-dialogue'
import markdownItFootnotePlugin from '@canopycanopycanopy/b-ber-grammar-footnotes'
import markdownItFrontmatterPlugin from '@canopycanopycanopy/b-ber-grammar-frontmatter'
import markdownItGallery from '@canopycanopycanopy/b-ber-grammar-gallery'
import markdownItIframe from '@canopycanopycanopy/b-ber-grammar-iframe'
import markdownItImage from '@canopycanopycanopy/b-ber-grammar-image'
import markdownItLogo from '@canopycanopycanopy/b-ber-grammar-logo'
import { resolve as resolveMedia } from '@canopycanopycanopy/b-ber-grammar-media'
import markdownItPullquote from '@canopycanopycanopy/b-ber-grammar-pullquote'
import markdownItSection from '@canopycanopycanopy/b-ber-grammar-section'
import markdownItSpread from '@canopycanopycanopy/b-ber-grammar-spread'
import markdownItVimeo from '@canopycanopycanopy/b-ber-grammar-vimeo'
import {
  type DocumentEnv,
  type DocumentInput,
  type DocumentResult,
  type FootnoteNumbering,
  getTarget,
  nestedEnv,
} from '@canopycanopycanopy/b-ber-lib'
import markdownItFootnote, {
  Counter,
} from '@canopycanopycanopy/b-ber-parser-footnotes'
import { markGalleryItems } from '@canopycanopycanopy/b-ber-parser-gallery'
import hljs from 'highlight.js'
import MarkdownIt from 'markdown-it'
import markdownItFrontmatter from 'markdown-it-front-matter'
import {
  blockSpan,
  type Diagnostic,
  type DirectiveEnv,
  directives,
  type InlineClaim,
} from './directives'
import { legacyHost } from './legacy-host'
import { type LegacyRender, legacyInline } from './legacy-render'

const LINE_BREAK = '\n'
const SPACE = ' '

// The env of one render: the directive rule's diagnostics and tree, and the
// document the grammars read and write (b-ber-lib's `DocumentEnv`)
export type RenderEnv = DirectiveEnv & DocumentEnv

// A document's XHTML, and everything rendering it collected for the build
export interface RenderedDocument extends DocumentResult {
  html: string
  diagnostics: Diagnostic[]
}

// The book's footnote numbering, which the build makes once and passes to
// every document it renders (see b-ber-lib's `FootnoteNumbering`)
export const createFootnoteNumbering = (): FootnoteNumbering => new Counter()

const emptyResult = (): DocumentResult => ({
  figures: [],
  footnotes: [],
  guide: [],
  frontMatter: [],
  remoteAssets: [],
})

// What a document is taken to be when its render is given less, as in tests:
// an epub of `_project` with no media, the first document of its book
const defaultDocument = (fileName: string): DocumentInput => ({
  fileName,
  title: fileName,
  target: getTarget('epub'),
  images: (name) => path.join('_project', '_images', name),
  audio: [],
  video: [],
  media: {},
  groupFootnotes: true,
  figuresBefore: 0,
  footnotesBefore: 0,
  footnotes: createFootnoteNumbering(),
})

class MarkdownRenderer {
  markdownIt: MarkdownIt.MarkdownIt

  constructor() {
    // Instance of MarkdownIt class
    this.markdownIt = new MarkdownIt({
      html: true,
      xhtmlOut: true,
      breaks: false,
      linkify: false,

      // Syntax highlighting using highlight.js
      highlight: (str: string, lang: string): string => {
        if (lang && hljs.getLanguage(lang)) {
          try {
            return hljs.highlight(str, { language: lang }).value
          } catch (_) {
            // noop
          }
        }

        return ''
      },
    })

    // A caption is rendered with the env of a nested render, which shares the
    // document and what it collects
    const reference = {
      instance: {
        renderInline: (src: string, env: DocumentEnv) =>
          this.markdownIt.renderInline(src, nestedEnv(env)),
      },
    }

    // b-ber-parser-gallery marked gallery items once a gallery's or a
    // spread's tokens were complete, inside every gallery
    const galleryItems = (state: MarkdownIt.StateBlock) => {
      const { isOpen, isClose } = blockSpan('gallery')
      markGalleryItems(
        this.markdownIt,
        state.tokens,
        isOpen,
        isClose,
        state.env as RenderEnv
      )
    }

    // What the grammars' string renders were called with
    const options = this.markdownIt.options

    // A single-line directive whose grammar still renders a string
    const legacy = <F extends string>(
      family: F,
      {
        validate,
        render,
      }: { validate: InlineClaim['validate']; render: LegacyRender }
    ) => ({ family, validate, render: legacyInline(family, render, options) })

    // The single-line directives, in the order their plugins were registered
    const inline = [
      { family: 'figure', ...markdownItImage.renderer(reference) },
      legacy('audio-video', markdownItAudioVideo.renderer(reference)),
      legacy('vimeo', markdownItVimeo.renderer(reference)),
      { family: 'iframe', ...markdownItIframe.renderer(reference) },
      { family: 'logo', ...markdownItLogo.renderer() },
    ] as const

    const section = markdownItSection.renderer()
    const pullquote = markdownItPullquote.renderer(reference)

    // The directive rule takes every directive over from its parser
    // (TASK-174 and TASK-175), at the place in the rule order the first of
    // them had, and renders each with its grammar as before
    this.markdownIt.use(directives, {
      host: legacyHost(),
      blocks: {
        section: section.render,
        pullquote: pullquote.render,
        dialogue: markdownItDialogue.renderer({}).render,
        gallery: markdownItGallery.renderer({}).render,
        spread: markdownItSpread.renderer().render,
      },
      // A `media` line is resolved for the target being built when it
      // renders. It used to be spliced into the Markdown before the parse
      media: (type, id, env: RenderEnv) =>
        resolveMedia({
          type,
          id,
          build: env.document.target.name,
          media: env.document.media,
        }),
      nested: (env: RenderEnv) => nestedEnv(env),
      afterBlock: { gallery: galleryItems, spread: galleryItems },
      inline,
    })

    // markdown-it-front-matter calls back with the front matter alone, from
    // inside its block rule. Its rule is wrapped so that the callback is given
    // the env of the parse it is in; nothing is kept once the rule returns
    const frontMatter = markdownItFrontmatterPlugin()
    let parsing: RenderEnv | undefined
    markdownItFrontmatter(
      {
        block: {
          ruler: {
            before: (beforeName, ruleName, rule, options) =>
              this.markdownIt.block.ruler.before(
                beforeName,
                ruleName,
                (state, startLine, endLine, silent) => {
                  const outer = parsing
                  parsing = state.env as RenderEnv
                  try {
                    return rule(state, startLine, endLine, silent)
                  } finally {
                    parsing = outer
                  }
                },
                options
              ),
          },
        },
      } as MarkdownIt.MarkdownIt,
      (meta) => frontMatter(meta, parsing as RenderEnv)
    )

    this.markdownIt.use(markdownItFootnote, markdownItFootnotePlugin(this))
  }

  template(meta: string, fileName: string): string {
    const str = meta
      .split(LINE_BREAK)
      .map((value) => `${SPACE.repeat(2)}${value}`)
      .join(LINE_BREAK)

    return `-${LINE_BREAK}${SPACE.repeat(2)}fileName: ${fileName}${LINE_BREAK}${str}${LINE_BREAK}`
  }

  // Transforms a markdown file to XHTML. What the grammars collect is added
  // to `env.result`, and problems with the directives to `env.diagnostics`;
  // what the build throws and prints is unchanged. A document the env does
  // not give is taken from `defaultDocument`
  render(
    fileName: string,
    data: string,
    env: Partial<RenderEnv> & { document?: Partial<DocumentInput> } = {}
  ): string {
    env.document = { ...defaultDocument(fileName), ...env.document }
    env.result ??= emptyResult()
    env.diagnostics ??= []
    env.file ??= `_markdown/${fileName}.md`
    return this.markdownIt.render(data, env)
  }

  // Renders one document of a build, and returns its XHTML with what it
  // collected: figures, footnotes, guide items, front matter, remote assets
  // and diagnostics. Nothing is kept between documents but what `document`
  // carries, the book's footnote numbering
  renderDocument(document: DocumentInput, source: string): RenderedDocument {
    const env: RenderEnv = {
      document,
      result: emptyResult(),
      diagnostics: [],
    }
    const html = this.render(document.fileName, source, env)
    return { html, ...env.result, diagnostics: env.diagnostics ?? [] }
  }
}

const markdownRenderer = new MarkdownRenderer()
export default markdownRenderer
