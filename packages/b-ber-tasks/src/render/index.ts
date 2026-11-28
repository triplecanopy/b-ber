import path from 'node:path'
import {
  type DocumentInput,
  type FootnoteNumbering,
  type SpineItem,
  Template,
} from '@canopycanopycanopy/b-ber-lib'
import state from '@canopycanopycanopy/b-ber-lib/State'
import log from '@canopycanopycanopy/b-ber-logger'
import MarkdownRenderer, {
  createFootnoteNumbering,
  type RenderedDocument,
} from '@canopycanopycanopy/b-ber-markdown-renderer'
import Xhtml from '@canopycanopycanopy/b-ber-templates/Xhtml'
import fs from 'fs-extra'

const writeMarkupToFile = (fname: string, markup: string) => {
  fs.writeFile(state.dist.text(`${fname}.xhtml`), markup).then(() =>
    log.info(`render xhtml [${path.basename(fname)}.xhtml]`)
  )
}

// What the renderer is told about a document and the book it is in. The
// grammars read all of this from State until TASK-177
const documentInput = (
  fileName: string,
  footnotes: FootnoteNumbering
): DocumentInput => {
  const entry = state.find('spine.flattened', { fileName }) as
    | Omit<SpineItem, 'nodes'>
    | undefined

  return {
    fileName,
    title: entry?.title || fileName,
    target: state.target,
    images: (name) => state.src.images(name),
    audio: state.audio,
    video: state.video,
    media: state.media,
    groupFootnotes: Boolean(state.config.group_footnotes),
    figuresBefore: state.figures.length,
    footnotesBefore: state.footnotes.length,
    footnotes,
  }
}

// Writes what rendering a document collected where the later tasks read it:
// `loi` the figures, `footnotes` the notes, `opf` the guide and the remote
// assets, `web` the front matter. A thin adapter until the tasks take these
// as return values (TASK-165)
const collect = (fileName: string, rendered: RenderedDocument) => {
  for (const figure of rendered.figures) state.add('figures', figure)
  for (const notes of rendered.footnotes) state.add('footnotes', notes)
  for (const item of rendered.guide) state.add('guide', item)
  for (const asset of rendered.remoteAssets) state.add('remoteAssets', asset)
  for (const meta of rendered.frontMatter) {
    const data = state.spine.frontMatter.get(fileName)
    if (data) state.spine.frontMatter.set(fileName, { ...data, ...meta })
  }
}

// Convert Markdown to HTML and wrap with page template
const createPageLayout = (
  fileName: string,
  data: string,
  footnotes: FootnoteNumbering
) => {
  const textDir = state.dist.text()
  const rendered = MarkdownRenderer.renderDocument(
    documentInput(fileName, footnotes),
    data
  )
  collect(fileName, rendered)
  const markup = Template.render(rendered.html, Xhtml.body())

  return fs
    .mkdirp(textDir)
    .then(() => writeMarkupToFile(fileName, markup))
    .catch((err) => {
      throw log.error(err)
    })
}

const createXTHMLFile = (fpath: string, footnotes: FootnoteNumbering) =>
  fs
    .readFile(fpath, 'utf8')
    .then((data) =>
      createPageLayout(path.basename(fpath, '.md'), data, footnotes)
    )
    .catch((err) => {
      throw log.error(err)
    })

function render() {
  const markdownDir = state.src.markdown()
  // One per build: footnotes may be numbered across the whole book
  const footnotes = createFootnoteNumbering()

  return fs.readdir(markdownDir).then((files) => {
    // Sort the files in the order that they appear in `type.yml`, so that they
    // and the images they contain are processed in the correct order
    const promises = files
      .filter((a) => a.charAt(0) !== '.')
      .sort((a, b) => {
        const fileNameA = path.basename(a, '.md')
        const fileNameB = path.basename(b, '.md')
        const indexA = state.indexOf('spine.flattened', { fileName: fileNameA })
        const indexB = state.indexOf('spine.flattened', { fileName: fileNameB })

        return indexA < indexB ? -1 : indexA > indexB ? 1 : 0
      })
      .reduce(
        (acc, curr) =>
          acc.then(() =>
            createXTHMLFile(path.join(markdownDir, curr), footnotes).then(() =>
              log.info(`render markdown [${path.basename(curr)}]`)
            )
          ),
        Promise.resolve()
      )

    return promises.catch((err) => {
      throw log.error(err)
    })
  })
}

export default render
