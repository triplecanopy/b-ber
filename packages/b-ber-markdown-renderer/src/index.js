import MarkdownIt from 'markdown-it'
import markdownItFrontmatter from 'markdown-it-front-matter'
import markdownItFootnote from '@canopycanopycanopy/b-ber-parser-footnotes'
import markdownItSection from '@canopycanopycanopy/b-ber-grammar-section'
import markdownItPullquote from '@canopycanopycanopy/b-ber-grammar-pullquote'
import markdownItLogo from '@canopycanopycanopy/b-ber-grammar-logo'
import markdownItImage from '@canopycanopycanopy/b-ber-grammar-image'
import markdownItAudioVideo from '@canopycanopycanopy/b-ber-grammar-audio-video'
import markdownItVimeo from '@canopycanopycanopy/b-ber-grammar-vimeo'
import markdownItDialogue from '@canopycanopycanopy/b-ber-grammar-dialogue'
import markdownItGallery from '@canopycanopycanopy/b-ber-grammar-gallery'
import markdownItSpread from '@canopycanopycanopy/b-ber-grammar-spread'
import markdownItFrontmatterPlugin from '@canopycanopycanopy/b-ber-grammar-frontmatter'
import markdownItFootnotePlugin from '@canopycanopycanopy/b-ber-grammar-footnotes'
import mediaDirectivePreProcessor from '@canopycanopycanopy/b-ber-grammar-media'
import hljs from './highlightjs'

class MarkdownRenderer {
  constructor() {
    this.noop = MarkdownRenderer.noop
    this.fileName = ''

    // Instance of MarkdownIt class
    this.markdownIt = new MarkdownIt({
      html: true,
      xhtmlOut: true,
      breaks: false,
      linkify: false,

      // Syntax highlighting using highlight.js
      highlight: (str, lang) => {
        if (lang && hljs.getLanguage(lang)) {
          try {
            return hljs.highlight(lang, str).value
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
      .use(markdownItFrontmatter, markdownItFrontmatterPlugin(this))
      .use(markdownItFootnote, markdownItFootnotePlugin(this))
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
        markdownItLogo.plugin,
        markdownItLogo.name,
        markdownItLogo.renderer(reference)
      )
  }

  template(meta) {
    const str = meta
      .split('\n')
      .map(value => `  ${value}`)
      .join('\n')

    return `-\n  fileName: ${this.fileName}\n${str}\n`
  }

  // Runs transformations on the Markdown to prepare it for rendering
  // eslint-disable-next-line class-methods-use-this
  prepare(data) {
    return mediaDirectivePreProcessor.render(data)
  }

  // Transforms a markdown file to XHTML
  render(fileName, data) {
    this.fileName = fileName
    const transformedData = this.prepare(data)
    return this.markdownIt.render(transformedData)
  }
}

const markdownRenderer = new MarkdownRenderer()
export default markdownRenderer
