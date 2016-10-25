
import MarkdownIt from 'markdown-it'

// https://www.npmjs.com/package/markdown-it-footnote
import mdFootnote from 'markdown-it-footnote'


import mdSection from './md-directives/md-section'
import mdImages from './md-directives/md-images'

const md = new MarkdownIt({
  html: true,
  xhtmlOut: true,
  breaks: false,
  linkify: false
})

md.use(
  mdSection.plugin,
  mdSection.name,
  mdSection.renderer(md)
).use(
  mdFootnote
).use(
  mdImages.plugin,
  mdImages.name,
  mdImages.renderer(md)
)

export default md
