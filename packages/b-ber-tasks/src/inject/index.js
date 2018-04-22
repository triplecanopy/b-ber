/**
 * @module inject
 */


import fs from 'fs-extra'
import path from 'path'
import File from 'vinyl'
import request from 'request'
import log from '@canopycanopycanopy/b-ber-logger'
import Xhtml from '@canopycanopycanopy/b-ber-templates/Xhtml'
import state from '@canopycanopycanopy/b-ber-lib/State'
import mime from 'mime-types'
import {minify} from 'html-minifier'


const htmlMinifyOptions = state.config.html_minify_options || {
    collapseWhitespace: true,
    collapseInlineTagWhitespace: false,
    html5: true,
    keepClosingSlash: true,
    removeAttributeQuotes: false,
    removeComments: true,
    removeEmptyAttributes: true,
    removeScriptTypeAttributes: true,
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
            if (err) throw err
            if (!files) throw new Error(`No files found in [${path.basename(dirpath)}]`)
            resolve(files)
        }))

/**
 * Get JSON-LD representation of the book's metadata
 * @param {Array}  args Results from Promise.all()
 * @return {Object}     Vinyl File object
 */
const getJSONLDMetadata = args =>
    new Promise(resolve => {
        // TODO: a manifest file needs to be written and read from

        const [, stylesheets, javascripts] = args
        const resources = []
        const prefix = state.build === 'web' ? state.config.contentURL : ''

        stylesheets.forEach(a => {
            resources.push({
                href: `${prefix}/OPS/stylesheets/${a}`,
                type: 'text/css',
            })
        })

        javascripts.forEach(a => {
            resources.push({
                href: `${prefix}${path.sep}OPS${path.sep}javascripts${path.sep}${a}`,
                type: 'application/javascript',
            })
        })

        const spine = state.spine.map(a => {
            const result = {
                href: a.remotePath,
                type: mime.lookup(a.absolutePath),
            }
            if (a.title) { // TODO: this needs to be added to `state.spine` during parsing
                result.title = a.title
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

        state.metadata.forEach(item => {
            if (item.term && item.value) {
                webpubManifest.metadata[item.term] = item.value
            }
        })

        const content = JSON.stringify(webpubManifest)
        const source  = 'json-ld'
        const target  = 'json-ld'
        const suffix  = 'content'
        const url     = `http://rdf-translator.appspot.com/convert/${source}/${target}/${suffix}`
        const form    = {content}
        const file    = new File({path: 'metadata.json-ld'})

        if (state.env !== 'production') {
            file.contents = new Buffer('')
            return resolve([...args, file])
        }

        return request.post({url, form}, (err, resp, body) => {
            if (err) throw err
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
        fs.readFile(path.join(state.dist, 'OPS', 'text', source), (err, data) => {
            if (err) throw err
            resolve(new File({contents: new Buffer(data)}))
        })
    )

/**
 * Replace the contents of the RegExp tokens with asset paths
 * @param  {Array} files Files to inject
 * @return {Array}
 * @throws {Error} If a file does not have a .js or .css extension
 */
const templateify = files =>
    files.map(file => {
        let fileType
        if (file instanceof File) { // if file is a vinyl File object
            fileType = file.path.slice(file.path.lastIndexOf('.'))
        } else {
            fileType = path.extname(file).toLowerCase()
        }
        switch (fileType) {
            case '.js':
                return Xhtml.script().replace(/\{% body %\}/, `..${path.sep}javascripts${path.sep}${file}`)
            case '.css':
                return Xhtml.stylesheet().replace(/\{% body %\}/, `..${path.sep}stylesheets${path.sep}${file}`)
            case '.json-ld':
                return Xhtml.script('application/ld+json', true).replace(/\{% body %\}/, String(file.contents))
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

const injectTags = args => {
    const {content, data, start, stop} = args
    const toInject = templateify(data.constructor === Array ? data : [data])
    let result = ''
    let endMatch

    // TODO: remove for..of
    for (const startMatch of matchIterator(start, content)) { // eslint-disable-line no-restricted-syntax
        stop.lastIndex = start.lastIndex
        endMatch = stop.exec(content)

        if (!endMatch) throw new Error(`Missing end tag for start tag: ${startMatch[0]}`)

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
    new Promise(resolve => {
        fs.writeFile(location, data, err => {
            if (err) throw err
            log.info(`emit [${path.basename(location)}]`)
            resolve()
        })
    })

const promiseToReplace = (prop, data, source, file) =>
    new Promise(async resolve => {
        log.info(`inject ${prop} [${source}]`)

        const stream  = file || await getContents(source)
        const start   = startTags[prop]
        const stop    = endTags[prop]
        const content = stream.contents.toString('utf8')

        const result = new File({
            path: source,
            contents: new Buffer(
                injectTags({content, start, stop, data})
            ),
        })

        resolve(result)
    })

// Iterate over the list of XHTML files, injecting script and style tags
// inside of the placeholders
const mapSources = args => {
    const [htmlDocs, stylesheets, javascripts, metadata] = args
    return new Promise(resolve => {
        htmlDocs.forEach((source, index) =>
            promiseToReplace('stylesheets', stylesheets, source)
                .then(file => promiseToReplace('javascripts', javascripts, source, file))
                .then(file => promiseToReplace('metadata', metadata, source, file))
                .then(file => {
                    const contents = state.env === 'production'
                        ? minify(file.contents.toString('utf8'), htmlMinifyOptions)
                        : file.contents.toString('utf8')
                    write(path.join(state.dist, 'OPS', 'text', source), contents)
                })
                .catch(err => log.error(err))
                .then(_ => {
                    if (index === htmlDocs.length - 1) resolve()
                })

        )
    })
}

// We create a dummy file that has the injected stylesheets, javascripts,
// etc., so that we can continue to create documents on the fly without re-
// running the inject task.  This is necessary for adding scripts and styles
// to nav documents (toc.xhtml) which is dynamically generated, but requires
// that
// 1) all the pages in the book are already written to disk, and
// 2) all the pages in the book already have the scripts/styles injected into
//    them, since we scan the html files looking for these tags when building
//    the content.opf
const dummy = new File({
    path: 'dummy.xhtml',
    contents: new Buffer(`<?xml version="1.0" encoding="UTF-8" standalone="no"?>
        <html xmlns="http://www.w3.org/1999/xhtml"
        xmlns:epub="http://www.idpf.org/2007/ops"
        xmlns:ibooks="http://vocabulary.itunes.apple.com/rdf/ibooks/vocabulary-extensions-1.0"
        epub:prefix="ibooks: http://vocabulary.itunes.apple.com/rdf/ibooks/vocabulary-extensions-1.0">
        <head>
            <title></title>
            ${state.config.private ? '<meta name="robots" content="noindex,nofollow"/>' : '<meta name="robots" content="index,follow"/>'}
            <meta http-equiv="default-style" content="text/html charset=utf-8"/>
            <!-- inject:css -->
            <!-- end:css -->
        </head>
        <body>
        {% body %}
        <!-- inject:js -->
        <!-- end:js -->
        <!-- inject:metadata -->
        <!-- end:metadata -->
        </body>
    </html>`),
})

// `mapSourcesToDynamicPageTemplate` accomplishes the same as `mapSources`
// above, but we pass in the vinyl file object (dummy) in the first
// `promiseToReplace`.  This function then parses the result into `pageHead`
// and `pageTail` functions and adds them to the `template` object in `state`
const mapSourcesToDynamicPageTemplate = args => {
    const [, stylesheets, javascripts, metadata] = args
    const docs = [dummy.path]

    return new Promise(resolve => {
        docs.forEach(source =>
            promiseToReplace('stylesheets', stylesheets, source, dummy)
                .then(file => promiseToReplace('javascripts', javascripts, source, file))
                .then(file => promiseToReplace('metadata', metadata, source, file))
                .then(file => {
                    const tmpl = file.contents.toString()
                    const [head, tail] = tmpl.split('{% body %}')

                    state.templates.dynamicPageTmpl = _ => tmpl
                    state.templates.dynamicPageHead = _ => head
                    state.templates.dynamicPageTail = _ => tail
                })
                .catch(err => log.error(err))
                .then(resolve)
        )
    })
}

const inject = _ =>
    new Promise(resolve => {
        Promise.all([
            getDirContents(path.join(state.dist, 'OPS', 'text')),
            getDirContents(path.join(state.dist, 'OPS', 'stylesheets')),
            getDirContents(path.join(state.dist, 'OPS', 'javascripts')),
        ])
            .then(getJSONLDMetadata)
            .then(files =>
                Promise.all([
                    mapSources(files),
                    mapSourcesToDynamicPageTemplate(files),
                ])
            )
            .catch(err => log.error(err))
            .then(resolve)
    })

export default inject
