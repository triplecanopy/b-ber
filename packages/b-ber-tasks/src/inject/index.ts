import fs from 'fs-extra'
import path from 'path'
import File from 'vinyl'
import log from '@canopycanopycanopy/b-ber-logger'
import state from '@canopycanopycanopy/b-ber-lib/State'
import { Template } from '@canopycanopycanopy/b-ber-lib'
import Xhtml from '@canopycanopycanopy/b-ber-templates/Xhtml'

const getRemoteAssets = (type: string) =>
  Promise.resolve(state.config[`remote_${type}`] || [])

const getAssets = (type: string) =>
  Promise.all([
    fs.readdir(state.dist.ops(type)),
    getRemoteAssets(type),
  ]).then(([a, b]) => [...a, ...(b as any[])])

const getInlineScripts = () => [
  new File({
    contents: Buffer.from(
      `window.bber = window.bber || {}; window.bber.env = '${state.build}';`
    ),
  }),
]

const ensureString = (objectOrString: any) =>
  objectOrString instanceof File
    ? objectOrString.contents?.toString() ?? ''
    : objectOrString

const relative = (from: string[], to: string[]) =>
  path.relative(path.join(...from), path.join(...to))

const render = ({
  file,
  basePath,
  stylesheets,
  javascripts,
  inlineStylesheets,
  inlineJavascripts,
  metadata,
}: {
  file: any
  basePath: string
  stylesheets: string[]
  javascripts: string[]
  inlineStylesheets: any[]
  inlineJavascripts: any[]
  metadata: any[]
}) => {
  const stylesheets_ = stylesheets
    .map(ensureString)
    .map(f =>
      Template.render(
        relative([basePath], ['stylesheets', f]),
        Xhtml.stylesheet()
      )
    )
    .join('')

  const inlineStylesheets_ = inlineStylesheets
    .map(ensureString)
    .map(f => Template.render(f, Xhtml.stylesheet(true)))
    .join('')

  const javascripts_ = javascripts
    .map(ensureString)
    .map(f =>
      Template.render(
        relative([basePath], ['javascripts', f]),
        Xhtml.javascript()
      )
    )
    .join('')

  const inlineJavascripts_ = inlineJavascripts
    .map(ensureString)
    .map(f => Template.render(f, Xhtml.javascript(true)))
    .join('')

  const metadata_ = metadata
    .map(ensureString)
    .map(f => Template.render(f, Xhtml.jsonLD()))
    .join('')

  const head = Template.render(
    `${stylesheets_}${inlineStylesheets_}`,
    Xhtml.head()
  )
  const body =
    file instanceof File
      ? file.contents?.toString() ?? ''
      : fs.readFileSync(state.dist.ops(basePath, file), 'utf8')
  const tail = Template.render(
    `${javascripts_}${inlineJavascripts_}${metadata_}`,
    Xhtml.tail()
  )

  return `${head}${body}${tail}`
}

const writeAll = (files: { fileName: string; contents: string }[]) =>
  Promise.all(
    files.map(file =>
      fs.writeFile(state.dist.text(file.fileName), file.contents)
    )
  )

export const getFileObjects = async (files: { name: string; data: any }[], basePath = '') => {
  const stylesheets = await getAssets('stylesheets')
  const javascripts = await getAssets('javascripts')
  const inlineStylesheets: any[] = []
  const inlineJavascripts = getInlineScripts()

  // TODO:
  // @issue: https://github.com/triplecanopy/b-ber/issues/226
  const metadata: any[] = []

  const files_ = files.map((file: { name: string; data: any }) => ({
    fileName: file.name,
    contents: render({
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

const inject = async () => {
  const basePath = 'text'
  const files = fs
    .readdirSync(state.dist.ops(basePath))
    .map(file => ({ name: file, data: file }))
  const fileObjects = await getFileObjects(files, basePath)

  return writeAll(fileObjects).catch(log.error)
}

export default inject
