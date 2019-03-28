/**
 * @module inject
 */

import fs from 'fs-extra'
import path from 'path'
import File from 'vinyl'
import log from '@canopycanopycanopy/b-ber-logger'
import state from '@canopycanopycanopy/b-ber-lib/State'
import { Template } from '@canopycanopycanopy/b-ber-lib'
import Xhtml from '@canopycanopycanopy/b-ber-templates/Xhtml'

const getRemoteAssets = type => Promise.resolve(state.config[`remote_${type}`] || [])

const getAssets = type =>
    Promise.all([fs.readdir(path.join(state.dist, 'OPS', type)), getRemoteAssets(type)]).then(([a, b]) => [...a, ...b])

const getInlineScripts = () => [
    new File({
        contents: Buffer.from(`window.bber = window.bber || {}; window.bber.env = '${state.build}';`),
    }),
]

const ensureString = objectOrString =>
    objectOrString instanceof File ? objectOrString.contents.toString() : objectOrString

const relative = (from, to) => path.relative(path.join(...from), path.join(...to))

const render = ({ file, basePath, stylesheets, javascripts, inlineStylesheets, inlineJavascripts, metadata }) => {
    const stylesheets_ = stylesheets
        .map(ensureString)
        .map(f => Template.render(relative([basePath], ['stylesheets', f]), Xhtml.stylesheet()))
        .join('')

    const inlineStylesheets_ = inlineStylesheets
        .map(ensureString)
        .map(f => Template.render(f, Xhtml.stylesheet(true)))
        .join('')

    const javascripts_ = javascripts
        .map(ensureString)
        .map(f => Template.render(relative([basePath], ['javascripts', f]), Xhtml.javascript()))
        .join('')

    const inlineJavascripts_ = inlineJavascripts
        .map(ensureString)
        .map(f => Template.render(f, Xhtml.javascript(true)))
        .join('')

    const metadata_ = metadata
        .map(ensureString)
        .map(f => Template.render(f, Xhtml.jsonLD()))
        .join('')

    const head = Template.render(`${stylesheets_}${inlineStylesheets_}`, Xhtml.head())
    const body =
        file instanceof File
            ? file.contents.toString()
            : fs.readFileSync(path.join(state.dist, 'OPS', basePath, file), 'utf8')
    const tail = Template.render(`${javascripts_}${inlineJavascripts_}${metadata_}`, Xhtml.tail())

    return `${head}${body}${tail}`
}

const writeAll = files =>
    Promise.all(files.map(f => fs.writeFile(path.join(state.dist, 'OPS', 'text', f.filename), f.contents)))

export const getFileObjects = async (files, basePath = '') => {
    const stylesheets = await getAssets('stylesheets')
    const javascripts = await getAssets('javascripts')
    const inlineStylesheets = []
    const inlineJavascripts = getInlineScripts()

    // TODO:
    // @issue: https://github.com/triplecanopy/b-ber/issues/226
    const metadata = []

    const files_ = files.map(file => ({
        filename: file.name,
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
    const files = fs.readdirSync(path.join(state.dist, 'OPS', basePath)).map(f => ({ name: f, data: f }))
    const fileObjects = await getFileObjects(files, basePath)

    return writeAll(fileObjects).catch(log.error)
}

export default inject
