import path from 'node:path'
import { targets } from '@canopycanopycanopy/b-ber-lib'
import state from '@canopycanopycanopy/b-ber-lib/State'
import YamlAdaptor from '@canopycanopycanopy/b-ber-lib/YamlAdaptor'
import log from '@canopycanopycanopy/b-ber-logger'
import fs from 'fs-extra'

// Generate new Markdown documents
// Front matter for the new page. Empty values are left out of it, so only
// the title, which names the file, is required
type PageMetadata = { title: string } & Record<string, string | undefined>

const createFile = ({
  markdownDir,
  metadata,
}: {
  markdownDir: string
  metadata: PageMetadata
}) => {
  const frontmatter = `---\n${Object.entries(metadata).reduce(
    (acc, [k, v]) => (v ? acc.concat(`${k}: ${v}\n`) : acc),
    ''
  )}---\n`

  const { title } = metadata
  const fileName = `${title.replace(/[^a-z0-9_-]/gi, '-')}.md`
  const filePath = path.join(markdownDir, fileName)

  if (fs.existsSync(filePath))
    throw log.error(`_markdown${path.sep}${fileName} already exists, aborting`)

  return fs.writeFile(filePath, frontmatter).then(() => ({ fileName }))
}

const writePageMeta = ({ fileName }: { fileName: string }) => {
  const tocFile = state.src.root('toc.yml')
  const pageMeta = (YamlAdaptor.load(tocFile) as string[]) || []
  const index = pageMeta.indexOf(fileName)
  const content = `\n- ${path.basename(fileName, '.md')}`

  if (index > -1) {
    throw new Error(
      `${fileName} already exists in [${path.basename(tocFile)}]. Aborting`
    )
  }

  // Add entry to main toc.yml
  const promises = [fs.appendFile(tocFile, content)]

  // If a target's own navigation file exists then write to it too
  Object.keys(targets).reduce(
    (acc, curr) =>
      fs.existsSync(state.src.root(`${curr}.yml`))
        ? acc.concat(fs.appendFile(state.src.root(`${curr}.yml`), content))
        : acc,
    promises
  )

  return Promise.all(promises).then(() => ({ fileName }))
}

// `bber generate`: a new Markdown page, listed in the navigation. Not a build
// step, so it reads the project through State. A plain function: it was a
// method of an instance created when the module was imported
const generate = (metadata: PageMetadata) => {
  // TODO: ensure markdown dir
  const markdownDir = state.src.markdown()
  return fs
    .mkdirp(markdownDir)
    .then(() => createFile({ markdownDir, metadata }))
    .then((resp) => writePageMeta(resp))
    .then(({ fileName }) => log.notice(`Generated new page [${fileName}]`))
    .catch((err) => {
      throw log.error(err)
    })
}

export default generate
