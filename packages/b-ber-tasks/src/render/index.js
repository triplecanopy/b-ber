import path from 'path'
import fs from 'fs-extra'
import MarkdownRenderer from '@canopycanopycanopy/b-ber-markdown-renderer'
import Xhtml from '@canopycanopycanopy/b-ber-templates/Xhtml'
import log from '@canopycanopycanopy/b-ber-logger'
import { Template } from '@canopycanopycanopy/b-ber-lib'
import state from '@canopycanopycanopy/b-ber-lib/State'

const writeMarkupToFile = (fname, markup) => {
  fs.writeFile(state.dist.text(`${fname}.xhtml`), markup).then(() =>
    log.info(`render xhtml [${path.basename(fname)}.xhtml]`)
  )
}

// Convert Markdown to HTML and wrap with page template
const createPageLayout = (fileName, data) => {
  const textDir = state.dist.text()
  const body = MarkdownRenderer.render(fileName, data)
  const markup = Template.render(body, Xhtml.body())

  return fs
    .mkdirp(textDir)
    .then(() => writeMarkupToFile(fileName, markup))
    .catch(log.error)
}

const createXTHMLFile = fpath =>
  fs
    .readFile(fpath, 'utf8')
    .then(data => createPageLayout(path.basename(fpath, '.md'), data))
    .catch(log.error)

function render() {
  const markdownDir = state.src.markdown()

  return fs.readdir(markdownDir).then(files => {
    // Sort the files in the order that they appear in `type.yml`, so that they
    // and the images they contain are processed in the correct order
    const promises = files
      .filter(a => a.charAt(0) !== '.')
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
            createXTHMLFile(path.join(markdownDir, curr)).then(() =>
              log.info(`render markdown [${path.basename(curr)}]`)
            )
          ),
        Promise.resolve()
      )

    return promises.catch(log.error)
  })
}

export default render
