import markdownItAudioVideo from '@canopycanopycanopy/b-ber-grammar-audio-video'
import markdownItDialogue from '@canopycanopycanopy/b-ber-grammar-dialogue'
import markdownItFootnotePlugin from '@canopycanopycanopy/b-ber-grammar-footnotes'
import markdownItFrontmatterPlugin from '@canopycanopycanopy/b-ber-grammar-frontmatter'
import markdownItGallery from '@canopycanopycanopy/b-ber-grammar-gallery'
import markdownItIframe from '@canopycanopycanopy/b-ber-grammar-iframe'
import markdownItImage from '@canopycanopycanopy/b-ber-grammar-image'
import markdownItLogo from '@canopycanopycanopy/b-ber-grammar-logo'
import mediaDirectivePreProcessor from '@canopycanopycanopy/b-ber-grammar-media'
import markdownItPullquote from '@canopycanopycanopy/b-ber-grammar-pullquote'
import markdownItSection from '@canopycanopycanopy/b-ber-grammar-section'
import markdownItSpread from '@canopycanopycanopy/b-ber-grammar-spread'
import markdownItVimeo from '@canopycanopycanopy/b-ber-grammar-vimeo'
import markdownItFootnote from '@canopycanopycanopy/b-ber-parser-footnotes'
import { markGalleryItems } from '@canopycanopycanopy/b-ber-parser-gallery'
import hljs from 'highlight.js'
import MarkdownIt from 'markdown-it'
import markdownItFrontmatter from 'markdown-it-front-matter'
import { blockSpan, type DirectiveEnv, directives } from './directives'
import { legacyHost } from './legacy-host'

const LINE_BREAK = '\n'
const SPACE = ' '

class MarkdownRenderer {
  fileName: string
  markdownIt: MarkdownIt.MarkdownIt

  constructor() {
    this.fileName = ''

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

    const reference = { instance: this.markdownIt, context: this }

    // b-ber-parser-gallery marked gallery items once a gallery's or a
    // spread's tokens were complete, inside every gallery
    const galleryItems = (state: MarkdownIt.StateBlock) => {
      const { isOpen, isClose } = blockSpan('gallery')
      markGalleryItems(this.markdownIt, state.tokens, isOpen, isClose)
    }

    // The single-line directives, in the order their plugins were registered
    const inline = (
      [
        ['figure', markdownItImage],
        ['audio-video', markdownItAudioVideo],
        ['vimeo', markdownItVimeo],
        ['iframe', markdownItIframe],
        ['logo', markdownItLogo],
      ] as const
    ).map(([family, grammar]) => {
      const { validate, render } = grammar.renderer(reference)
      return { family, validate, render }
    })

    const section = markdownItSection.renderer(reference)
    const pullquote = markdownItPullquote.renderer(reference)

    // The directive rule takes every directive over from its parser
    // (TASK-174 and TASK-175), at the place in the rule order the first of
    // them had, and renders each with its grammar as before
    this.markdownIt
      .use(directives, {
        host: legacyHost(this),
        legacy: {
          section: section.render,
          pullquote: pullquote.render,
          dialogue: markdownItDialogue.renderer(reference).render,
          gallery: markdownItGallery.renderer(reference).render,
          spread: markdownItSpread.renderer(reference).render,
        },
        close: { section: section.close, pullquote: pullquote.close },
        afterBlock: { gallery: galleryItems, spread: galleryItems },
        inline,
      })
      .use(markdownItFrontmatter, markdownItFrontmatterPlugin(this))
      .use(markdownItFootnote, markdownItFootnotePlugin(this))
  }

  template(meta: string): string {
    const str = meta
      .split(LINE_BREAK)
      .map((value) => `${SPACE.repeat(2)}${value}`)
      .join(LINE_BREAK)

    return `-${LINE_BREAK}${SPACE.repeat(2)}fileName: ${
      this.fileName
    }${LINE_BREAK}${str}${LINE_BREAK}`
  }

  // Runs transformations on the Markdown to prepare it for rendering
  prepare(data: string): string {
    return mediaDirectivePreProcessor.render(data)
  }

  // Transforms a markdown file to XHTML. Problems with the directives are
  // added to `env.diagnostics`; what the build throws and prints is unchanged
  render(
    fileName: string,
    data: string,
    env: DirectiveEnv = { diagnostics: [] }
  ): string {
    this.fileName = fileName
    env.file ??= `_markdown/${fileName}.md`
    const transformedData = this.prepare(data)
    return this.markdownIt.render(transformedData, env)
  }
}

const markdownRenderer = new MarkdownRenderer()
export default markdownRenderer
