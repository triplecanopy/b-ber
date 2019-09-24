/* eslint-disable class-methods-use-this */

import fs from 'fs-extra'
import path from 'path'
import crypto from 'crypto'
import state from '@canopycanopycanopy/b-ber-lib/State'
import find from 'lodash/find'
import { Url } from '@canopycanopycanopy/b-ber-lib'
import { generateWebpubManifest } from '@canopycanopycanopy/b-ber-lib/utils'
import log from '@canopycanopycanopy/b-ber-logger'
import rrdir from 'recursive-readdir'
import has from 'lodash/has'

class Reader {
    constructor() {
        this.outputDirName = 'epub'
        this.outputDir = state.dist.root(this.outputDirName)
        this.apiDir = state.dist.root('api')
        this.epubAssets = ['META-INF', 'OPS', 'mimetype']

        this.readerModuleName = '@canopycanopycanopy/b-ber-reader'
        this.readerModuleDistDir = 'dist'
        this.readerAppPath = null

        return this.createOutputDirs()
            .then(() => this.ensureReaderModuleExists())
            .then(() => this.copyEpubToOutputDir())
            .then(() => this.writeBookManifest())
            .then(() => this.writeWebpubManifest())
            .then(() => this.copyReaderAppToOutputDir())
            .then(() => this.injectServerDataIntoTemplate())
            .then(() => this.updateLinkedResourcesWithAbsolutePaths())
            .then(() => this.updateAssetURLsWithAbsolutePaths())
            .then(() => this.injectWebpubManifestLink())
            .catch(log.error)
    }

    get remoteURL() {
        if (
            process.env.NODE_ENV === 'production' &&
            (!state.config || !state.config.remote_url || /^http/.test(state.config.remote_url) === false)
        ) {
            throw new Error('Task [build/reader] requires a remote_url to be set in config.yml')
        }
        return state.config.remote_url || 'http://localhost:4000/'
    }

    createDirname(s) {
        if (!s || typeof s !== 'string') {
            return crypto.randomBytes(20).toString('hex')
        }
        return s.replace(/[^0-9a-zA-Z-]/g, '-')
    }

    ensureReaderModuleExists() {
        try {
            this.readerAppPath = path.join(
                path.dirname(path.join(require.resolve(this.readerModuleName))),
                this.readerModuleDistDir
            )
            return
        } catch (err) {
            // module not found using require.resolve, so we check if there's a symlinked version available
            log.warn(`Could not find globally installed module ${this.readerModuleName}`)
        }

        const { paths } = module
        let modulePath
        for (let i = 0; i < paths.length; i++) {
            const _path = path.resolve(paths[i], this.readerModuleName)
            if (fs.existsSync(_path)) {
                modulePath = _path
                break
            }
        }

        if (!modulePath) {
            log.error(`Cannot find module ${this.readerModuleName}. Try running npm i -S ${this.readerModuleName}`)
        }

        try {
            this.readerAppPath = fs.realpathSync(path.join(modulePath, this.readerModuleDistDir))
            const pkg = fs.readJsonSync(path.join(modulePath, this.readerModuleDistDir, 'package.json'))
            log.warn(`Loaded ${this.readerModuleName} v${pkg.version}`)

            return
        } catch (err) {
            log.error(`
                A symlinked version of ${this.readerModuleName} was found but is inaccessible.
                Try running npm i -S ${this.readerModuleName}, or rebuilding the reader package if running this command in a development environment
            `)
            process.exit(1)
        }
    }

    createOutputDirs() {
        return fs.ensureDir(this.outputDir).then(() => fs.ensureDir(this.apiDir))
    }

    copyEpubToOutputDir() {
        const epubDir = this.createDirname(this.getBookMetadata('identifier'))
        const promises = this.epubAssets.map(item =>
            fs.move(state.dist.root(item), path.join(this.outputDir, epubDir, item))
        )

        return Promise.all(promises)
    }

    getBookMetadata(term) {
        const entry = find(state.metadata.json(), { term })
        if (entry && entry.value) return entry.value
        log.warn(`Could not find metadata value for ${term}`)
        return ''
    }

    getProjectConfig(term) {
        if (!has(state.config, term)) {
            log.warn(`Invalid property for config: ${term}`)
        }

        return state.config[term]
    }

    writeBookManifest() {
        const identifier = this.getBookMetadata('identifier')
        const title = this.getBookMetadata('title')
        const url = `${Url.trimSlashes(this.remoteURL)}/${this.outputDirName}/${this.createDirname(identifier)}`
        const cover = `${url}/OPS/images/${this.getBookMetadata('cover')}`
        const manifest = [{ title, url, cover, id: identifier }]

        // write to an `api` dir in case the app is being deployed statically
        return fs.writeJson(path.join(this.apiDir, 'books.json'), manifest)
    }

    writeWebpubManifest() {
        const assetsDir = path.join(process.cwd(), this.outputDir, this.getBookMetadata('identifier'), 'OPS')
        return rrdir(assetsDir).then(files => {
            const manifest = generateWebpubManifest(state, files)
            fs.writeJson(state.dist.root('manifest.json'), manifest)
        })
    }

    injectWebpubManifestLink() {
        const indexHTML = state.dist.root('index.xhtml')
        const readerURL = Url.addTrailingSlash(this.getProjectConfig('reader_url'))

        let contents
        contents = fs.readFileSync(indexHTML, 'utf8')
        contents = contents.replace(
            /<\/head>/,
            `<link rel="manifest" type="application/webpub+json" href="${readerURL}manifest.json"></head>`
        )

        return fs.writeFile(indexHTML, contents)
    }

    copyReaderAppToOutputDir() {
        const promises = fs
            .readdirSync(this.readerAppPath)
            .map(file => fs.copy(path.join(this.readerAppPath, file), path.resolve(state.dist.root(file))))

        return Promise.all(promises)
    }

    injectServerDataIntoTemplate() {
        const indexHTML = state.dist.root('index.xhtml')
        const readerURL = Url.addTrailingSlash(this.getProjectConfig('reader_url'))
        const identifier = this.getBookMetadata('identifier')
        const bookURL = `${readerURL}epub/${identifier}`
        const serverData = {
            books: [
                {
                    title: this.getBookMetadata('title'),
                    url: bookURL,
                    cover: this.getBookMetadata('cover'),
                },
            ],
            bookURL,
            projectURL: Url.addTrailingSlash(this.getProjectConfig('remote_url')),
            downloads: this.getProjectConfig('downloads'),
            basePath: Url.addTrailingSlash(this.getProjectConfig('base_path')),
            loadRemoteLibrary: false,
            uiOptions: this.getProjectConfig('ui_options'),
            cache: this.getProjectConfig('cache'),
        }

        let contents
        contents = fs.readFileSync(indexHTML, 'utf8')
        contents = contents.replace(/__SERVER_DATA__ = {}/, `__SERVER_DATA__ = ${JSON.stringify(serverData)}`)

        return fs.writeFile(indexHTML, contents)
    }

    updateLinkedResourcesWithAbsolutePaths() {
        const indexContents = fs.readFileSync(state.dist.root('index.xhtml'), 'utf8')
        const versionHash = indexContents.match(/link href="\/(\w+\.css)"/)[1]
        const stylesheet = state.dist.root(versionHash)
        const readerURL = Url.addTrailingSlash(this.getProjectConfig('reader_url'))

        let contents
        contents = fs.readFileSync(stylesheet, 'utf8')
        contents = contents.replace(/url\(\//g, `url(${readerURL}`)

        return fs.writeFile(stylesheet, contents)
    }

    updateAssetURLsWithAbsolutePaths() {
        const indexHTML = state.dist.root('index.xhtml')
        const readerURL = Url.removeTrailingSlash(this.getProjectConfig('reader_url'))

        let contents
        contents = fs.readFileSync(indexHTML, 'utf8')
        contents = contents.replace(/(src|href)="(\/[^"]+?)"/g, `$1="${readerURL}$2"`)

        return fs.writeFile(indexHTML, contents)
    }
}

const main = () => new Reader()

export default main
