import fs from 'fs-extra'
import path from 'path'
import File from 'vinyl'
import request from 'request'
import mime from 'mime-types'
import state from '@canopycanopycanopy/b-ber-lib/State'

// We create a dummy file that has the injected stylesheets, javascripts,
// etc., so that we can continue to create documents on the fly without re-
// running the inject task.  This is necessary for adding scripts and styles
// to nav documents (toc.xhtml) which is dynamically generated, but requires
// that
// 1) all the pages in the book are already written to disk, and
// 2) all the pages in the book already have the scripts/styles injected into
//    them, since we scan the html files looking for these tags when building
//    the content.opf
export const dummy = new File({
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

export const getLeadingWhitespace = str => str.match(/^\s*/)[0]

export const getContents = source =>
    fs.readFile(path.join(state.dist, 'OPS', 'text', source))
        .then(data => new File({contents: new Buffer(data)}))

export const getRemoteResources = resource =>
    Promise.resolve(state.config[`remote_${resource}`] || [])

export const getResources = type =>
    Promise.all([
        fs.readdir(path.join(state.dist, 'OPS', type)),
        getRemoteResources(type),
    ])
        .then(([a, b]) => [...a, ...b])

export function* matchIterator(re, str) {
    let match
    while ((match = re.exec(str)) !== null) yield match
}

export const getJSONLDMetadata = args =>
    new Promise(resolve => {

        // TODO: following occasionally throws errors when building if the
        // rdf.translator API fails. commenting out for now. need to find a
        // stable, probably locally hosted, solution


        // if (state.env !== 'production') {
        return resolve([
            ...args,
            new File({
                path: 'metadata.json-ld',
                contents: new Buffer(''),
            }),
        ])
        // }

        // if (state.env !== 'production') {

        //     const [, stylesheets, javascripts] = args
        //     const resources = []
        //     const prefix = state.build === 'web' ? state.config.contentURL : ''

        //     stylesheets.forEach(a => {
        //         resources.push({
        //             href: `${prefix}${path.sep}OPS${path.sep}stylesheets${path.sep}${a}`,
        //             type: 'text/css',
        //         })
        //     })

        //     javascripts.forEach(a => {
        //         resources.push({
        //             href: `${prefix}${path.sep}OPS${path.sep}javascripts${path.sep}${a}`,
        //             type: 'application/javascript',
        //         })
        //     })

        //     const spine = state.spine.map(a => {
        //         const result = {
        //             href: a.remotePath || a.relativePath,
        //             type: mime.lookup(a.absolutePath),
        //         }
        //         if (a.title) { // TODO: this needs to be added to `state.spine` during parsing
        //             result.title = a.title
        //         }

        //         return result
        //     })

        //     const webpubManifest = {
        //         // '@context': 'http://readium.org/webpub/default.jsonld',
        //         '@context': 'http://schema.org/',
        //         metadata: {},
        //         links: [
        //             // {"rel": "self", "href": "http://example.org/bff.json", "type": "application/webpub+json"},
        //             // {"rel": "alternate", "href": "http://example.org/publication.epub", "type": "application/epub+zip"},
        //             // ...
        //         ],

        //         // spine: [{"href": "http://example.org/chapter1.html", "type": "text/html", "title": "Chapter 1"},]
        //         spine,
        //         resources,
        //     }

        //     state.metadata.forEach(item => {
        //         if (item.term && item.value) {
        //             webpubManifest.metadata[item.term] = item.value
        //         }
        //     })

        //     const content = JSON.stringify(webpubManifest)
        //     const source  = 'json-ld'
        //     const target  = 'json-ld'
        //     const suffix  = 'content'
        //     const url     = `http://rdf-translator.appspot.com/convert/${source}/${target}/${suffix}`
        //     const form    = {content}

        //     return request.post({url, form}, (err, resp, body) => {
        //         if (err) throw err
        //         if (resp.statusCode !== 200) throw new Error(`Error: ${resp.statusCode}`, err)

        //         return resolve([
        //             ...args,
        //             new File({
        //                 path: '.tmp',
        //                 contents: new Buffer(body),
        //             }),
        //         ])
        //     })
        // }
    })
