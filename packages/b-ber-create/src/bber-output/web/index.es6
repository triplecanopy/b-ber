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
import { build, src, dist } from 'bber-utils'
import log from 'b-ber-logger'
import store from 'bber-lib/store'
import { tocItem } from 'bber-templates/toc-xhtml'
import File from 'vinyl'
import renderLayouts from 'layouts'
import { find, findIndex } from 'lodash'


let ASSETS_TO_UNLINK
let DIST_PATH
let OPS_PATH

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

    return Promise.resolve()
}


function moveAssetsToRootDirctory() {
    return new Promise(resolve => {
        const assets = fs.readdirSync(OPS_PATH)

        assets.forEach((_, i) => {

            const to = path.join(DIST_PATH, _)
            const frm = path.join(OPS_PATH, _)

            fs.move(frm, to, (err) => {
                if (err) { throw err }
                log.info(`Moving [%s]`, _)
                if (i === assets.length - 1) {

                    // remove the OPS dir once all the moving assets have been moved
                    fs.remove(OPS_PATH, err => {
                        if (err) { throw err }
                        resolve()
                    })
                }
            })
        })
    })
}
function unlinkRedundantAssets() {
    return new Promise(resolve => {
        ASSETS_TO_UNLINK.forEach((_, i) => {
            log.info(`Removing [%s]`, path.basename(_))
            fs.remove(_, err => {
                if (err) { throw err }
                if (i === ASSETS_TO_UNLINK.length - 1) {
                    resolve()
                }
            })
        })
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
        const tocHTML = tocItem(toc).replace(/href="text/g, 'href="/text')
        const title = getProjectTitle()

        const navElement = `
            <nav id="toc" role="navigation">
                ${tocHTML}
            </nav>
        `

        const headerElement = `
            <header role="navigation">
                <div class="header__item">
                    <button>Navigation</button>
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
        html = `<a href="${href}">←</a>`
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
        html = `<a href="${href}">→</a>`
    }

    return html
}
function paginate(filePath) {
    return {
        prev: buttonPrev(filePath),
        next: buttonNext(filePath),
    }
}

function injectNavigationIntoFile(filePath, elements) {
    return new Promise(resolve => {
        const { navElement, headerElement } = elements
        const { prev, next } = paginate(filePath)


        log.info(`Adding pagination to ${path.basename(filePath)}`)
        fs.readFile(filePath, 'utf8', (err, data) => {
            if (err) { throw err }

            const navigation = headerElement + navElement + prev + next
            const contents = data.replace(/(<body[^>]*?>)/, `$1${navigation}`)

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
        const htmlFiles = fs.readdirSync(textPath).filter(_ => path.extname(_) === '.xhtml')
        const promises = []
        htmlFiles.forEach(_ => {
            const filePath = path.resolve(textPath, _)
            promises.push(injectNavigationIntoFile(filePath, elements))
        })

        Promise.all(promises).then(() => resolve(elements))

    })

}


function getProjectMetadataHTML() {
    return `
        <table>
        <tbody>
            ${store.metadata.reduce((acc, curr) => (
                acc.concat(`<tr>
                    <td>${curr.term}</td>
                    <td>${curr.value}</td>
                </tr>`)
            ), '') }
        </tbody>
        </table>
    `
}

function createIndexHTML({ navElement, headerElement }) {
    return new Promise(resolve => {
        const title = getProjectTitle()
        const metadataHTML = getProjectMetadataHTML()
        const indexHTML = `
            <!DOCTYPE html>
            <html>
                <head>
                    <title>${title}</title>
                </head>
                <body>
                    ${headerElement}
                    ${navElement}
                    <main>
                        ${metadataHTML}
                    </main>
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
function generateWebpubManifest() {}


const web = () => {
    return initialize()
    .then(unlinkRedundantAssets)
    .then(moveAssetsToRootDirctory)
    .then(createNavigationElement)
    .then(injectNavigationIntoFiles)
    .then(createIndexHTML)
    .catch(err => log.error(err))
}

export default web

