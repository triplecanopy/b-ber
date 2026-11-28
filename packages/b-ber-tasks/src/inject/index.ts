import path from 'node:path'
import { type BuildContext, Template } from '@canopycanopycanopy/b-ber-lib'
import log from '@canopycanopycanopy/b-ber-logger'
import Xhtml from '@canopycanopycanopy/b-ber-templates/Xhtml'
import fs from 'fs-extra'
import File from 'vinyl'
import { dist } from '../context'

// A file to link or inline: a vinyl file whose contents are the text, or a
// file name or URL
type Asset = File | string

const getRemoteAssets = (ctx: BuildContext, type: string) =>
  Promise.resolve(ctx.config[`remote_${type}`] || [])

const getAssets = (ctx: BuildContext, type: string) =>
  Promise.all([
    fs.readdir(dist(ctx).ops(type)),
    getRemoteAssets(ctx, type),
  ]).then(([a, b]) => [...a, ...(b as string[])])

// `window.bber.env` is the target's name, one of the four places a project
// sees it (TASK-160)
const getInlineScripts = (ctx: BuildContext) => [
  new File({
    contents: Buffer.from(
      `window.bber = window.bber || {}; window.bber.env = '${ctx.target.name}';`
    ),
  }),
]

const ensureString = (objectOrString: Asset): string =>
  objectOrString instanceof File
    ? (objectOrString.contents?.toString() ?? '')
    : objectOrString

const relative = (from: string[], to: string[]) =>
  path.relative(path.join(...from), path.join(...to))

const render = (
  ctx: BuildContext,
  {
    file,
    basePath,
    stylesheets,
    javascripts,
    inlineStylesheets,
    inlineJavascripts,
    metadata,
  }: {
    file: Asset
    basePath: string
    stylesheets: string[]
    javascripts: string[]
    inlineStylesheets: Asset[]
    inlineJavascripts: Asset[]
    metadata: Asset[]
  }
) => {
  const stylesheets_ = stylesheets
    .map(ensureString)
    .map((f) =>
      Template.render(
        relative([basePath], ['stylesheets', f]),
        Xhtml.stylesheet()
      )
    )
    .join('')

  const inlineStylesheets_ = inlineStylesheets
    .map(ensureString)
    .map((f) => Template.render(f, Xhtml.stylesheet(true)))
    .join('')

  const javascripts_ = javascripts
    .map(ensureString)
    .map((f) =>
      Template.render(
        relative([basePath], ['javascripts', f]),
        Xhtml.javascript()
      )
    )
    .join('')

  const inlineJavascripts_ = inlineJavascripts
    .map(ensureString)
    .map((f) => Template.render(f, Xhtml.javascript(true)))
    .join('')

  const metadata_ = metadata
    .map(ensureString)
    .map((f) => Template.render(f, Xhtml.jsonLD()))
    .join('')

  const head = Template.render(
    `${stylesheets_}${inlineStylesheets_}`,
    Xhtml.head()
  )
  const body =
    file instanceof File
      ? (file.contents?.toString() ?? '')
      : fs.readFileSync(dist(ctx).ops(basePath, file), 'utf8')
  const tail = Template.render(
    `${javascripts_}${inlineJavascripts_}${metadata_}`,
    Xhtml.tail()
  )

  return `${head}${body}${tail}`
}

const writeAll = (
  ctx: BuildContext,
  files: { fileName: string; contents: string }[]
) =>
  Promise.all(
    files.map((file) =>
      fs.writeFile(dist(ctx).text(file.fileName), file.contents)
    )
  )

export const getFileObjects = async (
  ctx: BuildContext,
  files: { name: string; data: Asset }[],
  basePath = ''
) => {
  const stylesheets = await getAssets(ctx, 'stylesheets')
  const javascripts = await getAssets(ctx, 'javascripts')
  const inlineStylesheets: Asset[] = []
  const inlineJavascripts = getInlineScripts(ctx)

  // TODO:
  // @issue: https://github.com/triplecanopy/b-ber/issues/226
  const metadata: Asset[] = []

  const files_ = files.map((file) => ({
    fileName: file.name,
    contents: render(ctx, {
      file: file.data,
      basePath,
      stylesheets,
      javascripts,
      inlineStylesheets,
      inlineJavascripts,
      metadata,
    }),
  }))

  return files_
}

// Wraps each page's body in the document head and tail, with the build's
// stylesheets and scripts
const inject = async (ctx: BuildContext) => {
  const basePath = 'text'
  const files = fs
    .readdirSync(dist(ctx).ops(basePath))
    .map((file) => ({ name: file, data: file }))
  const fileObjects = await getFileObjects(ctx, files, basePath)

  return writeAll(ctx, fileObjects).catch((err) => {
    throw log.error(err)
  })
}

export default inject
