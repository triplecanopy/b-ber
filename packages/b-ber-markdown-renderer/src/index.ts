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
import hljs from 'highlight.js'
import MarkdownIt from 'markdown-it'
import markdownItFrontmatter from 'markdown-it-front-matter'

const LINE_BREAK = '\n'
const SPACE = ' '

class MarkdownRenderer {
  fileName: string
  markdownIt: MarkdownIt

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

    this.markdownIt
      .use(
        markdownItSection.plugin,
        markdownItSection.name,
        markdownItSection.renderer(reference)
      )
      .use(
        markdownItPullquote.plugin,
        markdownItPullquote.name,
        markdownItPullquote.renderer(reference)
      )
      .use(markdownItFrontmatter as any, markdownItFrontmatterPlugin(this))
      .use(markdownItFootnote as any, markdownItFootnotePlugin(this))
      .use(
        markdownItDialogue.plugin,
        markdownItDialogue.name,
        markdownItDialogue.renderer(reference)
      )
      .use(
        markdownItGallery.plugin,
        markdownItGallery.name,
        markdownItGallery.renderer(reference)
      )
      .use(
        markdownItSpread.plugin,
        markdownItSpread.name,
        markdownItSpread.renderer(reference)
      )
      .use(
        markdownItImage.plugin,
        markdownItImage.name,
        markdownItImage.renderer(reference)
      )
      .use(
        markdownItAudioVideo.plugin,
        markdownItAudioVideo.name,
        markdownItAudioVideo.renderer(reference)
      )
      .use(
        markdownItVimeo.plugin,
        markdownItVimeo.name,
        markdownItVimeo.renderer(reference)
      )
      .use(
        markdownItIframe.plugin,
        markdownItIframe.name,
        markdownItIframe.renderer(reference)
      )
      .use(
        markdownItLogo.plugin,
        markdownItLogo.name,
        markdownItLogo.renderer(reference)
      )
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

  // Transforms a markdown file to XHTML
  render(fileName: string, data: string): string {
    this.fileName = fileName
    const transformedData = this.prepare(data)
    return this.markdownIt.render(transformedData)
  }
}

const markdownRenderer = new MarkdownRenderer()
export default markdownRenderer
