/* eslint-disable class-methods-use-this */

import fs from 'fs-extra'
import path from 'path'
import crypto from 'crypto'
import state from '@canopycanopycanopy/b-ber-lib/State'
import find from 'lodash/find'
import {trimSlashes} from '@canopycanopycanopy/b-ber-lib/utils'
import log from '@canopycanopycanopy/b-ber-logger'


class Reader {
    constructor() {
        this.outputDirName = 'epub'
        this.outputDir = path.join(this.dist, this.outputDirName)
        this.apiDir = path.join(this.dist, 'api')
        this.epubAssets = ['META-INF', 'OPS', 'mimetype']

        this.readerModuleName = '@canopycanopycanopy/b-ber-reader'
        this.readerModuleDistDir = 'dist'
        this.readerAppPath = null

        return new Promise(resolve => {
            this.createOutputDirs()
                .then(_ => this.ensureReaderModuleExists())
                .then(_ => this.copyEpubToOutputDir())
                .then(_ => this.writeBookManifest())
                .then(_ => this.copyReaderAppToOutputDir())
                .then(_ => this.injectServerDataIntoTemplate())
                .then(_ => this.updateLinkedResourcesWithAbsolutePaths())
                .then(_ => this.updateAssetURLsWithAbsolutePaths())
                .catch(err => log.error(err))
                .then(resolve)
        })

    }
    get src() {
        return state.src
    }
    get dist() {
        return state.dist
    }
    get remoteURL() {
        if (process.env.NODE_ENV === 'production' && (!state.config || !state.config.remote_url || /^http/.test(state.config.remote_url) === false)) {
            throw new Error(`Task [build/reader] requires a remote_url to be set in config.yml`)
        }
        return state.config.remote_url || 'http://localhost:4000/'
    }
    createDirname(s) {
        if (!s || typeof s !== 'string') return crypto.randomBytes(20).toString('hex')
        return s.replace(/[^0-9a-zA-Z-]/g, '-')
    }
    ensureReaderModuleExists() {
        try {
            this.readerAppPath = path.dirname(path.join(require.resolve(JSON.stringify(this.readerModuleName))))
            return Promise.resolve()
        } catch (err) {
            // module not found using require.resolve, so we check if there's a symlinked version available
        }

        const {paths} = module
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
            return Promise.resolve()
        } catch (err) {
            log.error(`
                A symlinked version of ${this.readerModuleName} was found but is inaccessible.
                Try running npm i -S ${this.readerModuleName}, or rebuilding the reader package if running this command in a development environment
            `)
            process.exit(1)
        }
    }
    createOutputDirs() {
        return fs.ensureDir(this.outputDir).then(_ => fs.ensureDir(this.apiDir))
    }
    copyEpubToOutputDir() {
        const promises = []
        const epubDir = this.createDirname(this.getBookMetadata('identifier'))
        return new Promise(resolve => {
            this.epubAssets.forEach(item =>
                promises.push(
                    fs.move(path.join(this.dist, item), path.join(this.outputDir, epubDir, item))
                )
            )

            Promise.all(promises).then(resolve)
        })
    }
    getBookMetadata(term) {
        const entry = find(state.metadata, {term})
        if (entry && entry.value) return entry.value
        log.warn(`Could not find metadata value for ${term}`)
        return ''
    }
    getProjectConfig(term) {
        const value = state.config[term]
        if (!value) {
            log.warn(`Could not find config value for ${term}`)
            return ''
        }
        return value
    }
    writeBookManifest() {
        const identifier = this.getBookMetadata('identifier')
        const title = this.getBookMetadata('title')
        const url = `${trimSlashes(this.remoteURL)}/${this.outputDirName}/${this.createDirname(identifier)}`
        const cover = `${url}/OPS/images/${this.getBookMetadata('cover')}`
        const manifest = [{title, url, cover, id: identifier}]

        // write to an `api` dir in case the app is being deployed statically
        return fs.writeJson(path.join(this.apiDir, 'books.json'), manifest)
    }
    copyReaderAppToOutputDir() {
        return fs.copy(this.readerAppPath, this.dist)
    }

    injectServerDataIntoTemplate() {
        const indexHTML = path.join(this.dist, 'index.html')
        const bookURL = `${this.getProjectConfig('reader_url').replace(/$\/+/, '')}/epub/${this.getBookMetadata('identifier')}`
        const serverData = {
            books: [{
                title: this.getBookMetadata('title'),
                url: bookURL,
                cover: this.getBookMetadata('cover'),
            }],
            bookURL,
            projectURL: this.getProjectConfig('remote_url'),
            downloads: this.getProjectConfig('builds'),
            basePath: this.getProjectConfig('base_path'),
            loadRemoteLibrary: false,

        }

        let contents
        contents = fs.readFileSync(indexHTML, 'utf8')
        contents = contents.replace(/__SERVER_DATA__ = {}/, `__SERVER_DATA__ = ${JSON.stringify(serverData)}`)

        return fs.writeFile(indexHTML, contents)
    }

    updateLinkedResourcesWithAbsolutePaths() {
        const indexContents = fs.readFileSync(path.join(this.dist, 'index.html'), 'utf8')
        const versionHash = indexContents.match(/link href="\/(\w+\.css)"/)[1]
        const stylesheet = path.join(this.dist, versionHash)

        let contents
        contents = fs.readFileSync(stylesheet, 'utf8')
        contents = contents.replace(/url\(\//g, `url(${this.getProjectConfig('reader_url')}/`)


        return fs.writeFile(stylesheet, contents)
    }

    updateAssetURLsWithAbsolutePaths() {
        const indexHTML = path.join(this.dist, 'index.html')

        let contents
        contents = fs.readFileSync(indexHTML, 'utf8')
        contents = contents.replace(/(src|href)="(\/[^"]+?)"/g, `$1="${this.getProjectConfig('reader_url')}$2"`)

        return fs.writeFile(indexHTML, contents)
    }

}

const main = _ => new Reader()

export default main
