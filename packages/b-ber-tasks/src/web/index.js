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
import has from 'lodash/has'
import cheerio from 'cheerio'
import log from '@canopycanopycanopy/b-ber-logger'
import state from '@canopycanopycanopy/b-ber-lib/State'
import { Url } from '@canopycanopycanopy/b-ber-lib'
import { getBookMetadata, generateWebpubManifest } from '@canopycanopycanopy/b-ber-lib/utils'
import Toc from '@canopycanopycanopy/b-ber-templates/Toc'
import rrdir from 'recursive-readdir'
import Template from './Template'

let ASSETS_TO_UNLINK
let DIST_PATH
let OPS_PATH
let OMIT_FROM_SEARCH
let BASE_URL
let flow // copy of spine for web task, see `WebFlow` below

// class to manage pagination for web layout. when building an epub, figures are
// handled outside of the spine, mostly so that they can have hashed file names
// (since they're generated on the fly), and so that the individual figures
// pages are not listed in the YAML files. the `WebFlow` class creates a new
// spine by merging in the loi
class WebFlow {
    constructor({ spine, loi }) {
        this.spine = spine
        this.loi = loi

        this.prepareLoi()
        this.addFiguresToSpine()
        this.removeNonLinearEntriesFromSpine()
    }

    // TODO: the naming scheme for figures is slightly different for figures
    // (the `fileName` property has a file extension). this needs to be fixed
    // @issue: https://github.com/triplecanopy/b-ber/issues/208
    prepareLoi() {
        this.loi = this.loi.map(a => {
            const b = { ...a }
            b.fileName = b.fileName.replace(/\.xhtml$/, '')
            b.relativePath = b.relativePath.replace(/\.xhtml$/, '')
            return b
        })
    }

    getFiguresPageIndex() {
        const fileName = 'figures-titlepage'
        return findIndex(this.spine, { fileName })
    }

    addFiguresToSpine() {
        if (!this.loi.length) return

        const figuresPageIndex = this.getFiguresPageIndex()
        if (figuresPageIndex < 0) return

        this.spine.splice(figuresPageIndex + 1, 0, ...this.loi)
    }

    removeNonLinearEntriesFromSpine() {
        this.spine = this.spine.flattened.filter(a => a.linear)
    }
}

// make sure we're using the correct build variables
async function initialize() {
    DIST_PATH = state.distDir
    OPS_PATH = path.join(DIST_PATH, 'OPS')
    BASE_URL = Url.addTrailingSlash(state.config.base_url)

    ASSETS_TO_UNLINK = [
        path.join(DIST_PATH, 'mimetype'),
        path.join(DIST_PATH, 'META-INF'),
        path.join(DIST_PATH, 'OPS/content.opf'),
        path.join(DIST_PATH, 'OPS/toc.ncx'),
    ]

    OMIT_FROM_SEARCH = [
        // list of spine item entry `fileName`s
        'toc',
    ]

    const { spine, loi } = state
    flow = new WebFlow({ spine, loi })
}

async function moveAssetsToRootDirctory() {
    const files = fs.readdirSync(OPS_PATH)
    const dirs = files.filter(file => file.charAt(0) !== '.' && fs.statSync(path.join(OPS_PATH, file)).isDirectory())
    const promises = dirs.map(dir => {
        const from = path.join(OPS_PATH, dir)
        const to = path.join(DIST_PATH, dir)

        log.info('Moving [%s]', dir)
        return fs.move(from, to)
    })

    // remove the OPS dir once all the moving assets have been moved
    await Promise.all(promises)
    return fs.remove(OPS_PATH)
}

function unlinkRedundantAssets() {
    const promises = ASSETS_TO_UNLINK.map(file => {
        log.info('Removing [%s]', path.basename(file))
        return fs.remove(file)
    })

    return Promise.all(promises)
}

function getProjectTitle() {
    let title = ''
    const titleEntry = getBookMetadata('title', state)
    if (titleEntry && titleEntry.value) {
        title = titleEntry.value
    }

    return title
}

function getChapterTitle(fileName) {
    if (typeof fileName !== 'string') return getProjectTitle()

    let title = ''
    const entry = find(flow.spine, { fileName })
    if (entry && entry.title) {
        ;({ title } = entry)
    }

    return title
}

function getProjectMetadataHTML() {
    return Template.metadata(state.metadata.json())
}

function getHeaderElement(fileName) {
    const title = getChapterTitle(fileName)
    return Template.header(title)
}

function createNavigationElement() {
    const { toc } = state
    const tocHTML = Toc.items(toc).replace(/a href="/g, `a href="${BASE_URL}`)
    const metadataHTML = getProjectMetadataHTML()
    const title = getProjectTitle()

    const tocElement = Template.toc(BASE_URL, title, tocHTML)
    const infoElement = Template.info(metadataHTML)

    return { tocElement, infoElement }
}

function buttonPrev(filePath) {
    const fileName = path.basename(filePath, '.xhtml')
    const index = findIndex(flow.spine, { fileName })
    const prevIndex = index - 1

    let html = ''

    if (index > -1 && flow.spine[prevIndex]) {
        const href = `${flow.spine[prevIndex].fileName}.xhtml`
        html = Template.prev(BASE_URL, href)
    }

    return html
}

function buttonNext(filePath) {
    const fileName = path.basename(filePath, '.xhtml')
    const index = findIndex(flow.spine, { fileName })
    const nextIndex = index + 1

    let html = ''

    if (index > -1 && flow.spine[nextIndex]) {
        const href = `${flow.spine[nextIndex].fileName}.xhtml`
        html = Template.next(BASE_URL, href)
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
    return Template.pagination(prev, next)
}

function injectBaseURL(script) {
    const script_ = typeof script === 'string' ? script : String(script)
    return Buffer.from(script_.replace(/%BASE_URL%/g, BASE_URL))
}

function getStyleBlock() {
    return Template.styles()
}

function getNavigationToggleScript() {
    const content = injectBaseURL(fs.readFileSync(path.join(__dirname, 'navigation.js')))
    return Template.scripts(content)
}

function getWebWorkerScript() {
    const content = injectBaseURL(fs.readFileSync(path.join(__dirname, 'search.js')))
    return Template.scripts(content)
}

function getEventHandlerScript() {
    const content = injectBaseURL(fs.readFileSync(path.join(__dirname, 'event-handlers.js')))
    return Template.scripts(content)
}

function injectPageElementsIntoFile(filePath) {
    const { tocElement, infoElement } = createNavigationElement()
    const pageNavigation = paginationNavigation(filePath)
    const styleBlock = getStyleBlock()
    const navigationToggleScript = getNavigationToggleScript()
    const webWorkerScript = getWebWorkerScript()
    const evenHandlerScript = getEventHandlerScript()
    const headerElement = getHeaderElement(path.basename(filePath, path.extname(filePath)))

    log.info(`Adding pagination to ${path.basename(filePath)}`)

    const data = fs.readFileSync(filePath, 'utf8')

    // prepare to modify publication content
    let contents

    // prepend the dynamically generated elements to body, adding a
    // wrapper around the main publication content. this allows us to
    // create a sliding nav, fixed header, etc.
    contents = data.replace(/(<body[^>]*?>)/, Template.body(styleBlock, headerElement))

    // close the wrapper element, adding a little javascript for the
    // navigation toggle. should be moved to core when stable
    contents = contents.replace(
        /(<\/body>)/,
        Template.footer(
            pageNavigation,
            tocElement,
            infoElement,
            navigationToggleScript,
            webWorkerScript,
            evenHandlerScript
        )
    )

    log.info(`web writing ${path.basename(filePath)}`)

    return fs.writeFile(filePath, contents)
}

function injectPageElementsIntoFiles(elements) {
    const textPath = path.join(DIST_PATH, 'text')
    const files = fs.readdirSync(textPath).filter(file => path.extname(file) === '.xhtml')
    const promises = files.map(file => {
        const filePath = path.resolve(textPath, file)
        return injectPageElementsIntoFile(filePath, elements)
    })

    return Promise.all(promises).then(() => elements)
}

function indexPageContent() {
    const { spine } = flow
    const records = []

    let fileIndex = -1
    const promises = spine
        .filter(a => OMIT_FROM_SEARCH.indexOf(a.fileName) < 0)
        .map(entry =>
            fs.readFile(path.join(OPS_PATH, `${entry.relativePath}.xhtml`), 'utf8').then(data => {
                const $ = cheerio.load(data)
                const title = $('h1,h2,h3,h4,h5,h6')
                    .first()
                    .text()

                const body = $('body').text()
                const url = `${BASE_URL}text/${entry.fileName}.xhtml`

                fileIndex += 1
                records.push({ id: fileIndex, title, body, url })
            })
        )

    return Promise.all(promises).then(() => JSON.stringify(records))
}

function writeJSONPageData(json) {
    return fs.writeFile(path.join(DIST_PATH, 'search-index.json'), json)
}

function importVendorScripts() {
    const lunrPath = require.resolve('lunr')
    const outputPath = path.join(DIST_PATH, 'lunr.js')
    return fs.copy(lunrPath, outputPath)
}

function writeWebWorker() {
    const worker = injectBaseURL(fs.readFileSync(path.join(__dirname, 'worker.js')))
    return fs.writeFile(path.join(DIST_PATH, 'worker.js'), worker)
}

function writeWebpubManifest() {
    return new Promise((resolve, reject) => {
        rrdir(state.distDir, (err1, files) => {
            if (err1) reject(err1)

            const manifest = generateWebpubManifest(state, files)

            fs.writeJson(path.join(DIST_PATH, 'manifest.json'), manifest).then(resolve)
        })
    })
}

// subtracts 1 from `n` argument since `getPage` refrerences state.spine,
// which is 0-indexed
function getPage(_n = -1) {
    const n = _n - 1
    const url = `${BASE_URL}text/${flow.spine[n].fileName}.xhtml`
    return url
}

function getFirstPage() {
    return getPage(1)
}

function getCoverImage() {
    const metadata = state.metadata.json()
    const coverEntry = find(metadata, { term: 'cover' })
    const firstPage = getFirstPage()

    let coverImageSrc = 'images/'
    if (coverEntry && has(coverEntry, 'value')) {
        coverImageSrc += coverEntry.value
    }

    return Template.cover(firstPage, coverImageSrc)
}

function createIndexHTML() {
    const { tocElement, infoElement } = createNavigationElement()
    const title = getProjectTitle()
    const coverImage = getCoverImage()
    const navigationToggleScript = getNavigationToggleScript()
    const webWorkerScript = getWebWorkerScript()
    const headerElement = getHeaderElement()
    const styleBlock = getStyleBlock()
    const robotsMeta = Template.robots(state.config.private)

    // TODO: should get dynamic page template here to ensure asset hash on production build
    // @issue: https://github.com/triplecanopy/b-ber/issues/232
    const indexHTML = Template.index(
        BASE_URL,
        robotsMeta,
        title,
        styleBlock,
        tocElement,
        infoElement,
        headerElement,
        coverImage,
        navigationToggleScript,
        webWorkerScript
    )

    return fs.writeFile(path.resolve(DIST_PATH, 'index.html'), indexHTML)
}

const web = () =>
    initialize()
        .then(unlinkRedundantAssets)

        // Create search index
        .then(indexPageContent)
        .then(writeJSONPageData)

        // move files to root directory and create an index.html
        .then(moveAssetsToRootDirctory)
        .then(injectPageElementsIntoFiles)
        .then(createIndexHTML)

        // write scripts into HTML files
        .then(importVendorScripts)
        .then(writeWebpubManifest)
        .then(writeWebWorker)

        .catch(log.error)

export default web
