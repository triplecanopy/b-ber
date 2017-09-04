/**
 * @module inject
 */

import Promise from 'zousan'
import fs from 'fs-extra'
import path from 'path'
import File from 'vinyl'
import request from 'request'
import { log } from 'bber-plugins'
import { scriptTag, stylesheetTag, jsonLDTag } from 'bber-templates'
import { dist, build } from 'bber-utils'
import store from 'bber-lib/store'
import mime from 'mime-types'

// import util from 'util'

let output
const initialize = () => {
    output = dist()
}

/**
 * RegExp tokens to begin parsing
 * @type {Object<Object>}
 */
const startTags = {
    javascripts: new RegExp('<!-- inject:js -->', 'ig'),
    stylesheets: new RegExp('<!-- inject:css -->', 'ig'),
    metadata: new RegExp('<!-- inject:metadata -->', 'ig'),
}

/**
 * RegExp tokens to end parsing
 * @type {Object<Object>}
 */
const endTags = {
    javascripts: new RegExp('<!-- end:js -->', 'ig'),
    stylesheets: new RegExp('<!-- end:css -->', 'ig'),
    metadata: new RegExp('<!-- end:metadata -->', 'ig'),
}

/**
 * Get the contents of the output directory
 * @param {String} dirpath Directory path
 * @return {Array<String>}
 */
const getDirContents = dirpath =>
    new Promise(resolve =>
        fs.readdir(dirpath, (err, files) => {
            if (err) { throw err }
            if (!files) { throw new Error(`No files found in [${path.basename(dirpath)}]`) }
            resolve(files)
        }))

/**
 * Get JSON-LD representation of the book's metadata
 * @param {Array}  args Results from Promise.all()
 * @return {Object}     Vinyl File object
 */
const getJSONLDMetadata = args =>
    new Promise((resolve) => {
        // TODO: a manifest file needs to be written and read from

        const [, stylesheets, javascripts] = args
        const resources = []
        const prefix = build() === 'web' ? store.config.contentURL : ''

        stylesheets.forEach((_) => {
            resources.push({
                href: `${prefix}/OPS/stylesheets/${_}`,
                type: 'text/css',
            })
        })

        javascripts.forEach((_) => {
            resources.push({
                href: `${prefix}/OPS/javascripts/${_}`,
                type: 'application/javascript',
            })
        })

        const spine = store.spine.map((_) => {
            const result = {
                href: _.remotePath,
                type: mime.lookup(_.absolutePath),
            }
            if (_.title) { // TODO: this needs to be added to `store.spine` during parsing
                result.title = _.title
            }
            return result
        })

        const webpubManifest = {
            '@context': 'http://readium.org/webpub/default.jsonld',
            metadata: {},
            links: [
                // {"rel": "self", "href": "http://example.org/bff.json", "type": "application/webpub+json"},
                // {"rel": "alternate", "href": "http://example.org/publication.epub", "type": "application/epub+zip"},
                // ...
            ],

            // spine: [{"href": "http://example.org/chapter1.html", "type": "text/html", "title": "Chapter 1"},]
            spine,
            resources,
        }

        store.metadata.forEach((item) => {
            if (item.term && item.value) {
                webpubManifest.metadata[item.term] = item.value
            }
        })

        const content = JSON.stringify(webpubManifest)
        const source = 'json-ld'
        const target = 'json-ld'
        const suffix = 'content'
        const url = `http://rdf-translator.appspot.com/convert/${source}/${target}/${suffix}`
        const form = { content }
        const file = new File({ path: 'metadata.json-ld' })

        if (process.env.NODE_ENV !== 'production') {
            file.contents = new Buffer('')
            return resolve([...args, file])
        }

        return request.post({ url, form }, (err, resp, body) => {
            if (err) { throw err }
            if (resp.statusCode !== 200) {
                throw new Error(`Error: ${resp.statusCode}`, err)
            }

            resolve([
                ...args,
                new File({
                    path: 'metadata.json-ld',
                    contents: new Buffer(body),
                }),
            ])
        })
    })

/**
 * Get the contents of a file
 * @param  {String} source Path to the source file
 * @return {Object}        Vinyl file object
 */
const getContents = source =>
    new Promise(resolve =>
        fs.readFile(path.join(output, 'OPS/text', source), (err, data) => {
            if (err) { throw err }
            resolve(new File({ contents: new Buffer(data) }))
        })
    )

/**
 * Replace the contents of the RegExp tokens with asset paths
 * @param  {Array} files Files to inject
 * @return {Array}
 * @throws {Error} If a file does not have a .js or .css extension
 */
const templateify = files =>
    files.map((file) => {
        let fileType
        if (file instanceof File) { // if file is a vinyl File object
            fileType = file.path.slice(file.path.lastIndexOf('.'))
        } else {
            fileType = path.extname(file).toLowerCase()
        }
        switch (fileType) {
            case '.js':
                return scriptTag.replace(/\{% body %\}/, `../javascripts/${file}`)
            case '.css':
                return stylesheetTag.replace(/\{% body %\}/, `../stylesheets/${file}`)
            case '.json-ld':
                return jsonLDTag.replace(/\{% body %\}/, String(file.contents))
            default:
                throw new Error(`Unsupported filetype: ${file}`)
        }
    })

/**
 * Remove leading whitespace from a string
 * @param  {String} str String to trim
 * @return {String}
 */
const getLeadingWhitespace = str => str.match(/^\s*/)[0]

/**
 * Search and replace generator
 * @param {Object} re   Regular expression
 * @param {String} str  String to search
 * @return {Iterable<Array>}
 */
function* matchIterator(re, str) {
    let match
    while ((match = re.exec(str)) !== null) {
        yield match
    }
}

const injectTags = (args) => {
    const { content, data, start, stop } = args
    const toInject = templateify(data.constructor === Array ? data : [data])
    let result = ''
    let endMatch

    // TODO: remove for..of
    for (const startMatch of matchIterator(start, content)) { // eslint-disable-line no-restricted-syntax
        stop.lastIndex = start.lastIndex
        endMatch = stop.exec(content)

        if (!endMatch) { throw new Error(`Missing end tag for start tag: ${startMatch[0]}`) }

        const previousInnerContent = content.substring(start.lastIndex, endMatch.index)
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

const write = (location, data) =>
    new Promise((resolve) => {
        fs.writeFile(location, data, (err) => {
            if (err) { throw err }
            log.info(`bber-modifiers/inject: Wrote [${path.basename(location)}]`)
            resolve()
        })
    })

const promiseToReplace = (prop, data, source, file) =>
    new Promise(async (resolve) => {
        log.info(`bber-modifiers/inject: Preparing to write [${prop}] to [${source}]`)

        const stream = file || await getContents(source)
        const start = startTags[prop]
        const stop = endTags[prop]
        const content = stream.contents.toString('utf8')
        const result = new File({
            path: source,
            contents: new Buffer(
                injectTags({ content, start, stop, data })
            ),
        })
        resolve(result)
    })

const mapSources = (args) => {
    const [htmlDocs, stylesheets, javascripts, metadata] = args
    return new Promise((resolve) => {
        htmlDocs.forEach((source, index) =>
            promiseToReplace('stylesheets', stylesheets, source)
            .then(file => promiseToReplace('javascripts', javascripts, source, file))
            .then(file => promiseToReplace('metadata', metadata, source, file))
            .then(file => write(
                    path.join(output, 'OPS/text', source),
                    file.contents.toString('utf8'))
            )
            .catch(err => log.error(err))
            .then(() => {
                if (index === htmlDocs.length - 1) {
                    resolve()
                }
            })
        )
    })
}

const inject = () =>
    new Promise((resolve) => {
        initialize()
        Promise.all([
            getDirContents(`${output}/OPS/text/`),
            getDirContents(`${output}/OPS/stylesheets/`),
            getDirContents(`${output}/OPS/javascripts/`),
        ])
        .then(getJSONLDMetadata)
        .then(mapSources)
        .catch(err => log.error(err))
        .then(resolve)
    })

export default inject
