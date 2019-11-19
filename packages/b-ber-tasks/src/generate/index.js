/* eslint-disable class-methods-use-this */
import path from 'path'
import fs from 'fs-extra'
import YamlAdaptor from '@canopycanopycanopy/b-ber-lib/YamlAdaptor'
import log from '@canopycanopycanopy/b-ber-logger'
import state from '@canopycanopycanopy/b-ber-lib/State'
import sequences from '@canopycanopycanopy/b-ber-shapes-sequences/sequences'

// Generate new Markdown documents
class Generate {
  constructor() {
    this.init = this.init.bind(this)
  }

  createFile({ markdownDir, metadata }) {
    const frontmatter = `---\n${Object.entries(metadata).reduce(
      (acc, [k, v]) => (v ? acc.concat(`${k}: ${v}\n`) : acc),
      ''
    )}---\n`

    const { title } = metadata
    const fileName = `${title.replace(/[^a-z0-9_-]/gi, '-')}.md`
    const filePath = path.join(markdownDir, fileName)

    if (fs.existsSync(filePath))
      log.error(`_markdown${path.sep}${fileName} already exists, aborting`)

    return fs.writeFile(filePath, frontmatter).then(() => ({ fileName }))
  }

  writePageMeta({ fileName }) {
    const tocFile = state.src.root('toc.yml')
    const pageMeta = YamlAdaptor.load(tocFile) || []
    const index = pageMeta.indexOf(fileName)
    const content = `\n- ${path.basename(fileName, '.md')}`

    if (index > -1) {
      throw new Error(
        `${fileName} already exists in [${path.basename(tocFile)}]. Aborting`
      )
    }

    // Add entry to main toc.yml
    const promises = [fs.appendFile(tocFile, content)]

    // If overrides toc files exist then write to them too
    const builds = Object.keys(sequences)
    builds.reduce(
      (acc, curr) =>
        fs.existsSync(state.src.root(`${curr}.yml`))
          ? acc.concat(fs.appendFile(state.src.root(`${curr}.yml`), content))
          : acc,
      promises
    )

    return Promise.all(promises).then(() => ({ fileName }))
  }

  init(metadata) {
    // TODO: ensure markdown dir
    const markdownDir = state.src.markdown()
    return fs
      .mkdirp(markdownDir)
      .then(() => this.createFile({ markdownDir, metadata }))
      .then(resp => this.writePageMeta(resp))
      .then(({ fileName }) => log.notice(`Generated new page [${fileName}]`))
      .catch(log.error)
  }
}

const generate = new Generate().init
export default generate
