/**
 * @module web
 */

// Since the file structure for the `web` build is quite different from the
// other (ebook-style) builds, it's better for maintainability to rearrange
// the ebook-style directory structure rather than inserting a bunch of
// conditionals into the various build scripts.
//
// This script can also be modularized in the future as an `ebook-to-static-
// site` module for external use


import path from 'path'
import fs from 'fs-extra'
import find from 'lodash/find'
import findIndex from 'lodash/findIndex'
import cheerio from 'cheerio'
import log from '@canopycanopycanopy/b-ber-logger'
import state from '@canopycanopycanopy/b-ber-lib/State'
import Toc from '@canopycanopycanopy/b-ber-templates/Toc'


let ASSETS_TO_UNLINK
let DIST_PATH
let OPS_PATH
let OMIT_FROM_SEARCH
let BASE_URL
let flow // copy of spine for web task, see `WebFlow` below

function addTrailingSlash(s) {
    let s_ = s
    if (s_ === '/') return s_
    if (s_.charCodeAt(s_.length - 1) !== 47/* / */) {
        s_ += '/'
    }
    return s_
}

// class to manage pagination for web layout. when building an epub, figures are
// handled outside of the spine, mostly so that they can have hashed file names
// (since they're generated on the fly), and so that the individual figures
// pages are not listed in the YAML files. the `WebFlow` class creates a new
// spine by merging in the loi
class WebFlow {
    constructor({spine, loi}) {
        this.spine = spine
        this.loi = loi

        this.prepareLoi()
        this.addFiguresToSpine()
        this.removeNonLinearEntriesFromSpine()
    }

    // TODO: the naming scheme for figures is slightly different for figures
    // (the `fileName` property has a file extension). this needs to be fixed
    prepareLoi() {
        this.loi = this.loi.map(a => {
            const b = {...a}
            b.fileName = b.fileName.replace(/\.xhtml$/, '')
            b.relativePath = b.relativePath.replace(/\.xhtml$/, '')
            return b
        })
    }

    getFiguresPageIndex() {
        const fileName = 'figures-titlepage'
        return findIndex(this.spine, {fileName})
    }

    addFiguresToSpine() {
        if (!this.loi.length) return

        const figuresPageIndex = this.getFiguresPageIndex()
        if (figuresPageIndex < 0) return

        this.spine.splice(figuresPageIndex + 1, 0, ...this.loi)
    }

    removeNonLinearEntriesFromSpine() {
        this.spine = this.spine.filter(a => a.linear)
    }
}



// make sure we're using the correct build variables
function initialize() {
    DIST_PATH = state.dist
    OPS_PATH = path.join(DIST_PATH, 'OPS')
    BASE_URL = {}.hasOwnProperty.call(state.config, 'base_url') ? addTrailingSlash(state.config.base_url) : '/'

    ASSETS_TO_UNLINK = [
        path.join(DIST_PATH, 'mimetype'),
        path.join(DIST_PATH, 'META-INF'),
        path.join(DIST_PATH, 'OPS/content.opf'),
        path.join(DIST_PATH, 'OPS/toc.ncx'),
    ]

    OMIT_FROM_SEARCH = [ // list of spine item entry `fileName`s
        'toc',
    ]

    const {spine, loi} = state
    flow = new WebFlow({spine, loi})

    return Promise.resolve()
}


function moveAssetsToRootDirctory() {
    const promises = []
    return new Promise(resolve => {
        fs.readdir(OPS_PATH, (err, files) => {
            if (err) throw err

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

        ASSETS_TO_UNLINK.forEach(f => {
            log.info(`Removing [%s]`, path.basename(f))
            promises.push(fs.remove(f))
        })

        Promise.all(promises).then(resolve)

    })
}

function getProjectTitle() {
    let title = ''
    const titleEntry = find(state.metadata, {term: 'title'})
    if (titleEntry && titleEntry.value) {
        title = titleEntry.value
    }

    return title
}

function getChapterTitle(fileName) {
    if (typeof fileName !== 'string') return getProjectTitle()

    let title = ''
    const entry = find(flow.spine, {fileName})
    if (entry && entry.title) {
        title = entry.title
    }

    return title
}

function getProjectMetadataHTML() {
    return `
        <dl>
            ${state.metadata.reduce((acc, curr) => acc.concat(`
                <dt>${curr.term}</dt>
                <dd>${curr.value}</dd>
            `)
        , '')}
        </dl>
    `
}

function getHeaderElement(fileName) {
    const title = getChapterTitle(fileName)
    return `
        <header class="publication__header" role="navigation">
            <div class="header__item header__item__toggle header__item__toggle--toc">
                <button class="material-icons">view_list</button>
            </div>

            <div class="header__item header__item__title">
                <h1>${title}</h1>
            </div>

            <div class="header__item publication__search">
                <button class="material-icons publication__search__button publication__search__button--open">search</button>
                <input type="text" disabled="disabled" class="publication__search__input" placeholder="" value=""></input>
                <button class="material-icons publication__search__button publication__search__button--close">close</button>
            </div>

            <div class="header__item header__item__toggle header__item__toggle--info">
                <button class="material-icons">info</button>
            </div>
        </header>
    `
}

function createNavigationElement() {
    return new Promise(resolve => {
        const {toc} = state
        const tocHTML = Toc.items(toc).replace(/a href="/g, `a href="${BASE_URL}text/`)
        const metadataHTML = getProjectMetadataHTML()
        const title = getProjectTitle()

        const tocElement = `
            <nav class="publication__toc" role="navigation">
                <div class="publication__title">
                    <a href="${BASE_URL}">${title}</a>
                </div>
                ${tocHTML}
            </nav>
        `

        const infoElement = `
            <nav class="publication__info" role="navigation">
                ${metadataHTML}
            </nav>
        `

        resolve({tocElement, infoElement})
    })
}


function buttonPrev(filePath) {
    const fileName = path.basename(filePath, '.xhtml')
    const index = findIndex(flow.spine, {fileName})
    const prevIndex = index - 1

    let html = ''

    if (index > -1 && flow.spine[prevIndex]) {
        const href = `${flow.spine[prevIndex].fileName}.xhtml`
        html = `
            <div class="publication__nav__prev">
                <a class="publication__nav__link" href="${BASE_URL}text/${href}">
                    <i class="material-icons">arrow_back</i>
                </a>
            </div>
        `
    }

    return html
}
function buttonNext(filePath) {
    const fileName = path.basename(filePath, '.xhtml')
    const index = findIndex(flow.spine, {fileName})
    const nextIndex = index + 1

    let html = ''

    if (index > -1 && flow.spine[nextIndex]) {
        const href = `${flow.spine[nextIndex].fileName}.xhtml`
        html = `
            <div class="publication__nav__next">
                <a class="publication__nav__link" href="${BASE_URL}text/${href}">
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
    const {prev, next} = paginate(filePath)
    return `
        <nav class="publication__nav" role="navigation">
            ${prev}
            ${next}
        </nav>
    `
}

function injectBaseURL(script) {
    let script_ = ''

    if (typeof script === 'string') {
        script_ = script
    } else if (Buffer.isBuffer(script)) {
        script_ = String(script)
    }

    return new Buffer(script_.replace(/%BASE_URL%/g, BASE_URL))
}

function getNavigationToggleScript() {
    return `
        <script type="text/javascript">
        // <![CDATA[
        ${injectBaseURL(fs.readFileSync(path.join(__dirname, 'navigation.js')))}
        // ]]>
        </script>
    `
}

function getWebWorkerScript() {
    return `
        <script type="text/javascript">
        // <![CDATA[
        ${injectBaseURL(fs.readFileSync(path.join(__dirname, 'search.js')))}
        // ]]>
        </script>
    `
}

function getEventHandlerScript() {
    return `
        <script type="text/javascript">
        // <![CDATA[
        ${injectBaseURL(fs.readFileSync(path.join(__dirname, 'event-handlers.js')))}
        // ]]>
        </script>
    `
}

function injectNavigationIntoFile(filePath, {tocElement, infoElement}) {
    return new Promise(resolve => {
        const pageNavigation = paginationNavigation(filePath)
        const navigationToggleScript = getNavigationToggleScript()
        const webWorkerScript = getWebWorkerScript()
        const evenHandlerScript = getEventHandlerScript()
        const headerElement = getHeaderElement(path.basename(filePath, path.extname(filePath)))

        log.info(`Adding pagination to ${path.basename(filePath)}`)
        fs.readFile(filePath, 'utf8', (err, data) => {
            if (err) throw err

            // prepare to modify publication content
            let contents

            // prepend the dynamically generated elements to body, adding a
            // wrapper around the main publication content. this allows us to
            // create a sliding nav, fixed header, etc.
            //
            // TODO: eventually classlist should be parsed, or a more robust
            // solution implemented
            contents = data.replace(/(<body[^>]*?>)/, `
                $1
                <div class="publication">
                ${headerElement}
                <div class="publication__contents">
            `)

            // close the wrapper element, adding a little javascript for the
            // navigation toggle. should be moved to core when stable
            contents = contents.replace(/(<\/body>)/, `
                </div> <!-- / .publication__contents -->
                ${pageNavigation}
                </div> <!-- / .publication -->
                ${tocElement}
                ${infoElement}
                ${navigationToggleScript}
                ${webWorkerScript}
                ${evenHandlerScript}
                $1
            `)

            fs.writeFile(filePath, contents, err => {
                if (err) throw err
                log.info(`web writing ${path.basename(filePath)}`)
                resolve()
            })
        })
    })
}

function injectNavigationIntoFiles(elements) {
    return new Promise(resolve => {
        const textPath = path.join(DIST_PATH, 'text')
        const promises = []

        fs.readdir(textPath, (err, files) => {
            if (err) throw err

            files.forEach(f => {
                if (!path.extname(f) === '.xhtml') return
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

        const {spine} = flow
        const promises = []
        const records = []

        let fileIndex = -1
        spine.filter(a => OMIT_FROM_SEARCH.indexOf(a.fileName) < 0).forEach(entry =>
            promises.push(new Promise((resolve, reject) => {
                fs.readFile(path.join(OPS_PATH, `${entry.relativePath}.xhtml`), 'utf8', (err, data) => {
                    if (err) reject(err)

                    const $ = cheerio.load(data)
                    const title = $('h1,h2,h3,h4,h5,h6').first().text()
                    const body = $('body').text().replace(/\n\s+/g, '\n').trim() // reduce whitespace
                    const url = `${BASE_URL}text/${entry.fileName}.xhtml`

                    fileIndex += 1
                    records.push({id: fileIndex, title, body, url})
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
            if (err) reject(err)
            resolve()
        })
    })
}

function importVendorScripts() {
    return new Promise((resolve, reject) => {
        const lunrPath = require.resolve('lunr')
        const outputPath = path.join(DIST_PATH, 'lunr.js')
        fs.copy(lunrPath, outputPath)
            .catch(err => reject(err))
            .then(resolve)
    })
}

function writeWebWorker() {
    return new Promise((resolve, reject) => {
        const worker = injectBaseURL(fs.readFileSync(path.join(__dirname, 'worker.js')))
        fs.writeFile(path.join(DIST_PATH, 'worker.js'), worker, err => {
            if (err) reject(err)
            resolve()
        })
    })
}


// subtracts 1 from `n` argument since `getPage` refrerences state.spine,
// which is 0-indexed
function getPage(_n = -1) {
    const n = _n - 1
    let url = '#'
    try {
        url = `${BASE_URL}text/${flow.spine[n].fileName}.xhtml`
    } catch (err) {
        throw err
    }

    return url
}

function getFirstPage() {
    return getPage(1)
}

function getCoverImage() {
    const {metadata} = state
    const coverEntry = find(metadata, {term: 'cover'})
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

function createIndexHTML({tocElement, infoElement}) {
    return new Promise(resolve => {
        const title = getProjectTitle()
        const coverImage = getCoverImage()
        const navigationToggleScript = getNavigationToggleScript()
        const webWorkerScript = getWebWorkerScript()
        const headerElement = getHeaderElement()
        const robotsMeta = state.config.private ? '<meta name="robots" content="noindex,nofollow"/>' : '<meta name="robots" content="index,follow"/>'

        // TODO: should get dynamic page template here to ensure asset hash on production build
        const indexHTML = `
            <?xml version="1.0" encoding="UTF-8" standalone="no"?>
            <html xmlns="http://www.w3.org/1999/xhtml"
                xmlns:epub="http://www.idpf.org/2007/ops"
                xmlns:ibooks="http://vocabulary.itunes.apple.com/rdf/ibooks/vocabulary-extensions-1.0"
                epub:prefix="ibooks: http://vocabulary.itunes.apple.com/rdf/ibooks/vocabulary-extensions-1.0">
                <meta http-equiv="default-style" content="text/html charset=utf-8"/>
                ${robotsMeta}
                <link rel="stylesheet" type="text/css" href="${BASE_URL}stylesheets/application.css"/>

                <head>
                    <title>${title}</title>
                </head>
                <body>
                    ${tocElement}
                    ${infoElement}
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
            if (err) throw err
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

