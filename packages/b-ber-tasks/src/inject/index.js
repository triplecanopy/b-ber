/**
 * @module inject
 */

import fs from 'fs-extra'
import path from 'path'
import File from 'vinyl'
import log from '@canopycanopycanopy/b-ber-logger'
import Xhtml from '@canopycanopycanopy/b-ber-templates/Xhtml'
import state from '@canopycanopycanopy/b-ber-lib/State'
import {
    dummy,
    getLeadingWhitespace,
    getContents,
    getResources,
    matchIterator,
    getJSONLDMetadata,
} from './helpers'

const TOKENS_START = {
    javascripts: new RegExp('<!-- inject:js -->', 'ig'),
    stylesheets: new RegExp('<!-- inject:css -->', 'ig'),
    metadata: new RegExp('<!-- inject:metadata -->', 'ig'),
}

const TOKENS_STOP = {
    javascripts: new RegExp('<!-- end:js -->', 'ig'),
    stylesheets: new RegExp('<!-- end:css -->', 'ig'),
    metadata: new RegExp('<!-- end:metadata -->', 'ig'),
}

/**
 * Replace the contents of the RegExp tokens with asset paths
 * @param  {Array} files Files to inject
 * @return {Array}
 * @throws {Error} If a file does not have a .js or .css extension
 */
const templateify = files =>
    files.map(file => {
        let fileType
        let base = ''
        let dirName = ''

        if (file instanceof File) {
            // file is a vinyl File object
            fileType = file.path.slice(file.path.lastIndexOf('.'))
        } else {
            fileType = path.extname(file).toLowerCase()
        }

        dirName = fileType === '.css' ? 'stylesheets' : 'javascripts'
        base =
            /^(http|\/\/)/.test(file) === false
                ? `..${path.sep}${dirName}${path.sep}`
                : ''

        switch (fileType) {
            case '.js':
                return Xhtml.script().replace(/\{% body %\}/, `${base}${file}`)
            case '.css':
                return Xhtml.stylesheet().replace(
                    /\{% body %\}/,
                    `${base}${file}`,
                )
            case '.json-ld':
                return Xhtml.script('application/ld+json', true).replace(
                    /\{% body %\}/,
                    String(file.contents),
                )
            default:
                throw new Error(`Unsupported filetype: ${file}`)
        }
    })

const injectTags = args => {
    const { content, data, start, stop } = args
    const toInject = templateify(data.constructor === Array ? data : [data])

    let result = ''
    let endMatch

    // eslint-disable-next-line no-restricted-syntax
    for (const startMatch of matchIterator(start, content)) {
        stop.lastIndex = start.lastIndex
        endMatch = stop.exec(content)

        if (!endMatch) {
            throw new Error(`Missing end tag for start tag: ${startMatch[0]}`)
        }

        const previousInnerContent = content.substring(
            start.lastIndex,
            endMatch.index,
        )
        const indent = getLeadingWhitespace(previousInnerContent)

        toInject.unshift(startMatch[0])
        toInject.push(endMatch[0])

        result = [
            content.slice(0, startMatch.index),
            toInject.join(indent),
            content.slice(stop.lastIndex),
        ].join('')
    }

    return result
}

const promiseToReplace = (prop, data, source, file) =>
    new Promise(async resolve => {
        log.info(`inject ${prop} [${source}]`)

        const stream = file || (await getContents(source))
        const start = TOKENS_START[prop]
        const stop = TOKENS_STOP[prop]
        const content = stream.contents.toString('utf8')

        const result = new File({
            path: source,
            contents: new Buffer(injectTags({ content, start, stop, data })),
        })

        resolve(result)
    })

// Iterate over the list of XHTML files, injecting script and style tags
// inside of the placeholders
const mapSources = args => {
    const [htmlDocs, stylesheets, javascripts, metadata] = args
    const promises = htmlDocs.map(source => {
        const location = path.join(state.dist, 'OPS', 'text', source)

        return promiseToReplace('stylesheets', stylesheets, source)
            .then(file =>
                promiseToReplace('javascripts', javascripts, source, file),
            )
            .then(file => promiseToReplace('metadata', metadata, source, file))
            .then(file =>
                fs.writeFile(location, file.contents.toString('utf8')),
            )
            .then(() => log.info(`inject emit [${path.basename(location)}]`))
    })

    return Promise.all(promises).catch(log.error)
}

// `mapSourcesToDynamicPageTemplate` accomplishes the same as `mapSources`
// above, but we pass in the vinyl file object (dummy) in the first
// `promiseToReplace`.  This function then parses the result into `pageHead`
// and `pageTail` functions and adds them to the `template` object in `state`
const mapSourcesToDynamicPageTemplate = args => {
    const [, stylesheets, javascripts, metadata] = args
    const docs = [dummy.path]
    const promises = docs.map(source =>
        promiseToReplace('stylesheets', stylesheets, source, dummy)
            .then(file =>
                promiseToReplace('javascripts', javascripts, source, file),
            )
            .then(file => promiseToReplace('metadata', metadata, source, file))
            .then(file => {
                const tmpl = file.contents.toString()
                const [head, tail] = tmpl.split('{% body %}')

                state.templates.dynamicPageTmpl = _ => tmpl
                state.templates.dynamicPageHead = _ => head
                state.templates.dynamicPageTail = _ => tail
            }),
    )

    return Promise.all(promises).catch(log.error)
}

const inject = () =>
    Promise.all([
        fs.readdir(path.join(state.dist, 'OPS', 'text')),
        getResources('stylesheets'),
        getResources('javascripts'),
    ])
        .then(getJSONLDMetadata)
        .then(files =>
            Promise.all([
                mapSources(files),
                mapSourcesToDynamicPageTemplate(files),
            ]),
        )
        .catch(log.error)

export default inject
