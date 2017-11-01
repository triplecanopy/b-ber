/**
 * @module web
 *
 * Since the file structure for the `web` build is quite different from the
 * other (ebook-style) builds, it's better for maintainability to rearrange
 * the ebook-style directory structure rather than inserting a bunch of
 * conditionals into the various build scripts.
 *
 * This script can also be modularized in the future as an `ebook-to-static-
 * site` module for external use
 *
 */



import Promise from 'zousan'
import fs from 'fs-extra'
import path from 'path'
import { dist } from 'bber-utils'
import log from 'b-ber-logger'
import store from 'bber-lib/store'
import { tocItem } from 'bber-templates/toc-xhtml'
import { find, findIndex } from 'lodash'
import cheerio from 'cheerio'


let ASSETS_TO_UNLINK
let DIST_PATH
let OPS_PATH
let OMIT_FROM_SEARCH

// make sure we're using the correct build variables
function initialize() {
    DIST_PATH = dist()
    OPS_PATH = path.join(DIST_PATH, 'OPS')

    ASSETS_TO_UNLINK = [
        path.join(DIST_PATH, 'mimetype'),
        path.join(DIST_PATH, 'META-INF'),
        path.join(DIST_PATH, 'OPS/content.opf'),
        path.join(DIST_PATH, 'OPS/toc.ncx'),
    ]

    OMIT_FROM_SEARCH = [ // list of spine item entry `fileName`s
        'toc',
    ]

    return Promise.resolve()
}


function moveAssetsToRootDirctory() {
    const promises = []
    return new Promise(resolve => {
        fs.readdir(OPS_PATH, (err, files) => {
            if (err) { throw err }

            const dirs = files.filter(f => f.charAt(0) !== '.' && fs.statSync(path.join(OPS_PATH, f)).isDirectory())

            dirs.forEach(f => {

                const frm = path.join(OPS_PATH, f)
                const to = path.join(DIST_PATH, f)

                log.info(`Moving [%s]`, f)
                promises.push(fs.move(frm, to))

            })

            Promise.all(promises).then(() => {
                // remove the OPS dir once all the moving assets have been moved
                fs.remove(OPS_PATH).then(resolve)
            })
        })
    })
}
function unlinkRedundantAssets() {
    const promises = []
    return new Promise(resolve => {

        ASSETS_TO_UNLINK.forEach((f) => {
            log.info(`Removing [%s]`, path.basename(f))
            promises.push(fs.remove(f))
        })

        Promise.all(promises).then(resolve)

    })
}

function getProjectTitle() {
    let title = ''
    const titleEntry = find(store.metadata, { term: 'title' })
    if (titleEntry && titleEntry.value) {
        title = titleEntry.value
    }

    return title
}

function createNavigationElement() {
    return new Promise(resolve => {
        const { toc } = store

        // TODO: why is this invalidating the toc.xhtml?
        // generally, the folder stucture should be modified to allow
        // nesting, among other things
        const tocHTML = tocItem(toc).replace(/a href="/g, 'a href="/text/')
        const title = getProjectTitle()

        const navElement = `
            <nav class="publication__toc" role="navigation">
                <div class="publication__search">
                    <input disabled="disabled" class="publication__search__input" placeholder="Search" value="" />
                    <button class="material-icons publication__search__button">search</button>
                </div>
                ${tocHTML}
            </nav>
        `

        const headerElement = `
            <header class="publication__header" role="navigation">
                <div class="header__item header__item__toggle">
                    <button class="material-icons">view_list</button>
                </div>
                <div class="header__item">
                    <h1>
                        <a href="/">${title}</a>
                    </h1>
                </div>
            </header>
        `

        resolve({ navElement, headerElement })
    })
}


function buttonPrev(filePath) {
    const fileName = path.basename(filePath, '.xhtml')
    const index = findIndex(store.spine, { fileName })
    const prevIndex = index - 1

    let html = ''

    if (index > -1 && store.spine[prevIndex]) {
        const href = `${store.spine[prevIndex].fileName}.xhtml`
        html = `
            <div class="publication__nav__prev">
                <a class="publication__nav__link" href="${href}">
                    <i class="material-icons">arrow_back</i>
                </a>
            </div>
        `
    }

    return html
}
function buttonNext(filePath) {
    const fileName = path.basename(filePath, '.xhtml')
    const index = findIndex(store.spine, { fileName })
    const nextIndex = index + 1

    let html = ''

    if (index > -1 && store.spine[nextIndex]) {
        const href = `${store.spine[nextIndex].fileName}.xhtml`
        html = `
            <div class="publication__nav__next">
                <a class="publication__nav__link" href="${href}">
                    <i class="material-icons">arrow_forward</i>
                </a>
            </div>
        `
    }

    return html
}
function paginate(filePath) {
    return {
        prev: buttonPrev(filePath),
        next: buttonNext(filePath),
    }
}
function paginationNavigation(filePath) {
    const { prev, next } = paginate(filePath)
    return `
        <nav class="publication__nav" role="navigation">
            ${prev}
            ${next}
        </nav>
    `
}

function getNavigationToggleScript() {
    return `
        <script type="text/javascript">
        // <![CDATA[

        function registerNavEvents() {
            document.querySelector('.header__item__toggle button').addEventListener('click', function() {
                document.body.classList.toggle('nav--closed');
            }, false);
        }
        window.addEventListener('load', registerNavEvents, false);

        // ]]>
        </script>
    `
}

function getWebWorkerScript() {
    return `
        <script type="text/javascript">
        // <![CDATA[
        ${fs.readFileSync(path.join(__dirname, 'worker-init.js'))}
        // ]]>
        </script>
    `
}

function injectNavigationIntoFile(filePath, { navElement, headerElement }) {
    return new Promise(resolve => {
        const pageNavigation = paginationNavigation(filePath)
        const navigationToggleScript = getNavigationToggleScript()
        const webWorkerScript = getWebWorkerScript()

        log.info(`Adding pagination to ${path.basename(filePath)}`)
        fs.readFile(filePath, 'utf8', (err, data) => {
            if (err) { throw err }

            // prepare to modify publication content
            let contents

            // prepend the dynamically generated elements to body, adding a
            // wrapper around the main publication content. this allows us to
            // create a sliding nav, fixed header, etc.
            //
            // TODO: eventually classlist should be parsed, or a more robust
            // solution implemented
            contents = data.replace(/(<body[^>]*?>)/, `
                <body class="nav--closed">
                ${navElement}
                <div class="publication">
                ${headerElement}
                ${pageNavigation}
                <div class="publication__contents">
            `)

            // close the wrapper element, adding a little javascript for the
            // navigation toggle. should be moved to core when stable
            contents = contents.replace(/(<\/body>)/, `
                </div> <!-- / .publication__contents -->
                </div> <!-- / .publication -->
                ${navigationToggleScript}
                ${webWorkerScript}
                $1
            `)

            fs.writeFile(filePath, contents, err => {
                if (err) { throw err }
                log.info(`Writing web output for ${path.basename(filePath)}`)
                resolve()
            })
        })
    })
}

function injectNavigationIntoFiles({ navElement, headerElement }) {
    return new Promise(resolve => {
        const elements = { navElement, headerElement }
        const textPath = path.join(DIST_PATH, 'text')
        const promises = []

        fs.readdir(textPath, (err, files) => {
            if (err) { throw err }

            files.forEach(f => {
                if (!path.extname(f) === '.xhtml') { return }
                const filePath = path.resolve(textPath, f)
                promises.push(injectNavigationIntoFile(filePath, elements))
            })

            Promise.all(promises).then(() => resolve(elements))

        })

    })
}

function indexPageContent() {
    return new Promise((resolve, reject) => {
        // TODO: `indexPageContent` should create a `lunr` index for faster parsing down the line

        const { spine } = store
        const promises = []
        const records = []

        let fileIndex = -1
        spine.filter(_ => OMIT_FROM_SEARCH.indexOf(_.fileName) < 0).forEach(entry =>
            promises.push(new Promise((resolve, reject) => {
                fs.readFile(path.join(OPS_PATH, `${entry.relativePath}.xhtml`), 'utf8', (err, data) => {
                    if (err) { reject(err) }

                    const $ = cheerio.load(data)
                    const title = $('h1,h2,h3,h4,h5,h6').first().text()
                    const body = $('body').text().replace(/\n\s+/g, '\n').trim() // reduce whitespace
                    const url = `/text/${entry.fileName}.xhtml`

                    fileIndex += 1
                    records.push({ id: fileIndex, title, body, url })
                    resolve()
                })
            }))
        )

        Promise.all(promises)
        .catch(err => reject(err))
        .then(() => resolve(JSON.stringify(records)))
    })
}

function writeJSONPageData(json) {
    return new Promise((resolve, reject) => {
        fs.writeFile(path.join(DIST_PATH, 'search-index.json'), json, err => {
            if (err) { reject(err) }
            resolve()
        })
    })
}

function importVendorScripts() {
    return new Promise((resolve, reject) => {
        const searchScriptPath = path.resolve(__dirname, '../../../node_modules/lunr/lunr.js') // TODO: should have access to bber path in store
        const outputPath = path.join(DIST_PATH, 'lunr.js')
        fs.copy(searchScriptPath, outputPath)
            .catch(err => reject(err))
            .then(resolve)
    })
}

function writeWebWorker() {
    return new Promise((resolve, reject) => {
        const worker = fs.readFileSync(path.join(__dirname, 'worker.js'))
        fs.writeFile(path.join(DIST_PATH, 'worker.js'), worker, err => {
            if (err) { reject(err) }
            resolve()
        })
    })
}

// function getProjectMetadataHTML() {
//     return `
//         <table>
//         <tbody>
//             ${store.metadata.reduce((acc, curr) => (
//                 acc.concat(`<tr>
//                     <td>${curr.term}</td>
//                     <td>${curr.value}</td>
//                 </tr>`)
//             ), '') }
//         </tbody>
//         </table>
//     `
// }


// subtracts 1 from `n` argument since `getPage` refrerences store.spine,
// which is 0-indexed
function getPage(_n = -1) {
    const n = _n - 1
    let url
    try {
        url = `text/${store.spine[n].fileName}.xhtml`
    } catch (err) {
        if (err) { throw err }
    }

    return url
}

function getFirstPage() {
    return getPage(1)
}

function getCoverImage() {
    const { metadata } = store
    const coverEntry = find(metadata, { term: 'cover' })
    const firstPage = getFirstPage()

    let coverImageSrc = 'images/'
    if (coverEntry && {}.hasOwnProperty.call(coverEntry, 'value')) {
        coverImageSrc += coverEntry.value
    }

    return `
        <a class="cover__image__link" href="${firstPage}">
            <img class="cover__image" src="${coverImageSrc}" alt="Cover" />
        </a>
    `
}

function createIndexHTML({ navElement, headerElement }) {
    return new Promise(resolve => {
        const title = getProjectTitle()
        // const metadataHTML = getProjectMetadataHTML()
        const coverImage = getCoverImage()
        const navigationToggleScript = getNavigationToggleScript()
        const webWorkerScript = getWebWorkerScript()

        const indexHTML = `
            <?xml version="1.0" encoding="UTF-8" standalone="no"?>
            <html xmlns="http://www.w3.org/1999/xhtml"
                xmlns:epub="http://www.idpf.org/2007/ops"
                xmlns:ibooks="http://vocabulary.itunes.apple.com/rdf/ibooks/vocabulary-extensions-1.0"
                epub:prefix="ibooks: http://vocabulary.itunes.apple.com/rdf/ibooks/vocabulary-extensions-1.0">
                <meta http-equiv="default-style" content="text/html charset=utf-8"/>
                <link rel="stylesheet" type="text/css" href="../stylesheets/application.css"/>
                <head>
                    <title>${title}</title>
                </head>
                <body class="nav--closed">
                    ${navElement}
                    <div class="publication">
                        ${headerElement}
                        <div class="publication__contents">
                            <section>
                                ${coverImage}
                            </section>
                        </div>
                    </div>
                    ${navigationToggleScript}
                    ${webWorkerScript}
                </body>
            </html>
        `

        fs.writeFile(path.resolve(DIST_PATH, 'index.html'), indexHTML, err => {
            if (err) { throw err }
            resolve()
        })
    })
}

// TODO
// function generateWebpubManifest() {}


const web = () =>
    initialize()
        .then(unlinkRedundantAssets)

        // Create search index
        .then(indexPageContent)
        .then(writeJSONPageData)

        // move files to root directory and create an index.html
        .then(moveAssetsToRootDirctory)
        .then(createNavigationElement)
        .then(injectNavigationIntoFiles)
        .then(createIndexHTML)

        // write scripts into HTML files
        .then(importVendorScripts)
        .then(writeWebWorker)

        .catch(err => log.error(err))

export default web

