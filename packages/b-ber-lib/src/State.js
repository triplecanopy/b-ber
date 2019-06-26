import crypto from 'crypto'
import isPlainObject from 'lodash/isPlainObject'
import isArray from 'lodash/isArray'
import findIndex from 'lodash/findIndex'
import set from 'lodash/set'
import get from 'lodash/get'
import merge from 'lodash/merge'
import path from 'path'
import fs from 'fs-extra'
import mime from 'mime-types'
import themes from '@canopycanopycanopy/b-ber-themes'
import log from '@canopycanopycanopy/b-ber-logger'
import Yaml from './Yaml'
import Config from './Config'
import Spine from './Spine'

const cwd = process.cwd()

class State {
    metadata = { json: () => [{}] }
    theme = {}
    video = []
    audio = []
    buildTypes = {
        sample: {},
        epub: {},
        mobi: {},
        pdf: {},
        web: {},
        reader: {},
    }

    src = {
        root: (...args) => path.join(this.srcDir, ...args),
        images: (...args) => path.join(this.srcDir, '_images', ...args),
        markdown: (...args) => path.join(this.srcDir, '_markdown', ...args),
        stylesheets: (...args) => path.join(this.srcDir, '_stylesheets', ...args),
        javascripts: (...args) => path.join(this.srcDir, '_javascripts', ...args),
        fonts: (...args) => path.join(this.srcDir, '_fonts', ...args),
        media: (...args) => path.join(this.srcDir, '_media', ...args),
    }

    dist = {
        root: (...args) => path.join(this.distDir, ...args),
        ops: (...args) => path.join(this.distDir, 'OPS', ...args),
        text: (...args) => path.join(this.distDir, 'OPS', 'text', ...args),
        images: (...args) => path.join(this.distDir, 'OPS', 'images', ...args),
        stylesheets: (...args) => path.join(this.distDir, 'OPS', 'stylesheets', ...args),
        javascripts: (...args) => path.join(this.distDir, 'OPS', 'javascripts', ...args),
        fonts: (...args) => path.join(this.distDir, 'OPS', 'fonts', ...args),
        media: (...args) => path.join(this.distDir, 'OPS', 'media', ...args),
    }

    constructor() {
        let version

        // for testing, since our directory structure is different in dist
        try {
            ;({ version } = fs.readJSONSync(require.resolve('./package.json')))
        } catch (err) {
            ;({ version } = fs.readJSONSync(require.resolve('../package.json')))
        }

        this.version = version
        this.config = new Config()

        this.resetEntries()
        this.loadConfig()
        this.loadConfig()
        this.loadMetadata()
        this.loadMedia()
        this.loadBuilds()
        this.loadTheme()
    }

    static get defaults() {
        return {
            guide: [],
            figures: [],
            footnotes: [],
            build: 'epub',
            cursor: [],
            spine: [],
            toc: [],
            remoteAssets: [],
            loi: [],
            sequence: [],
            hash: crypto.randomBytes(20).toString('hex'),
        }
    }

    get srcDir() {
        return this.config.src
    }

    set srcDir(val) {
        this.config.src = val
    }

    get distDir() {
        if (this.build && this.buildTypes && this.buildTypes[this.build]) {
            return this.buildTypes[this.build].dist
        }
        return this.config.dist
    }

    set distDir(val) {
        this.config.dist = val
    }

    // eslint-disable-next-line class-methods-use-this
    get env() {
        return process.env.NODE_ENV || 'development'
    }

    set env(val) {
        this.config.env = val
    }

    reset() {
        this.resetEntries()
        this.loadConfig()
    }

    resetEntries() {
        Object.entries(State.defaults).forEach(([key, val]) => (this[key] = val))
    }

    add(prop, val) {
        if (isArray(this[prop])) {
            this[prop] = [...this[prop], val]
            return
        }

        if (isPlainObject(this[prop])) {
            this[prop] = { ...this[prop], val }
            return
        }

        if (typeof this[prop] === 'string') {
            this[prop] = `${this[prop]}${val}`
            return
        }

        throw new Error('Something went wrong in `State#add`')
    }

    remove(prop, val) {
        if (isArray(this[prop])) {
            const index = findIndex(this[prop], val)
            if (index < 0) {
                throw new TypeError(`The _property [${val}] could not be found in [state.${prop}]`)
            }
            this[prop].splice(index, 1)
            return
        }

        if (isPlainObject(this[prop])) {
            delete this[prop][val]
            return
        }

        throw new Error('Something went wrong in `State#remove`')
    }

    merge(prop, val) {
        this[prop] = merge(this[prop], val)
        return this[prop]
    }

    update(prop, val) {
        set(this, prop, val)
        return get(this, prop)
    }

    contains(collection, value) {
        return this.indexOf(collection, value) > -1
    }

    indexOf(collection, value) {
        return findIndex(this[collection], value)
    }

    loadConfig() {
        if (!fs.existsSync(path.join(cwd, 'config.yml'))) return
        const config = new Yaml('config')
        config.load(path.join(cwd, 'config.yml'))

        // not necessary right now to pass around a YAWN instance since we'er
        // not writing back to config.yml, but may be necessary at some point
        this.config = new Config(config.json())
    }

    loadMetadata() {
        const fpath = path.join(cwd, this.config.src, 'metadata.yml')
        if (!fs.existsSync(fpath)) return

        this.metadata = new Yaml('metadata')
        this.metadata.load(fpath)
    }

    loadTheme() {
        // ensure themes dir exists unless running `new` command, as it's the
        // only command that's run outside of a project directory
        if (process.argv.includes('new')) return

        const userThemesPath = path.resolve(cwd, this.config.themes_directory)
        fs.ensureDirSync(userThemesPath)

        // theme is set, using a built-in theme
        if (themes[this.config.theme]) {
            log.info(`Loaded theme [${this.config.theme}]`)
            this.theme = themes[this.config.theme]
            return
        }

        // possibly a user defined theme, check if the directory exists
        try {
            // eslint-disable-next-line global-require, import/no-dynamic-require
            if ((this.theme = require(path.resolve(userThemesPath, this.config.theme)))) {
                log.info(`Loaded theme [${this.config.theme}]`)
                return
            }
        } catch (err) {
            // noop
        }

        // possibly a theme installed with npm, test the project root
        try {
            // eslint-disable-next-line global-require, import/no-dynamic-require
            this.theme = require(path.resolve('node_modules', this.config.theme)) // require.resolve?
        } catch (err) {
            log.warn(`There was an error during require [${this.config.theme}]`)
            log.warn('Using default theme [b-ber-theme-serif]')
            log.warn(err.message)

            // error loading theme, set to default
            this.theme = themes['b-ber-theme-serif']
        }
    }

    loadMedia() {
        const mediaPath = path.join(cwd, this.config.src, '_media')
        try {
            if (fs.existsSync(mediaPath)) {
                const media = fs.readdirSync(mediaPath)
                const video = media.filter(a => /^video/.test(mime.lookup(a)))
                const audio = media.filter(a => /^audio/.test(mime.lookup(a)))

                this.video = video
                this.audio = audio
            }
        } catch (err) {
            throw new Error(err)
        }
    }

    loadBuildSettings(type) {
        const { src, dist } = this.config
        const projectDir = path.join(cwd, src)
        const navigationConfigFile = path.join(cwd, src, `${type}.yml`)

        try {
            if (!fs.existsSync(projectDir)) {
                throw new Error(`Project directory [${projectDir}] does not exist`)
            }
        } catch (err) {
            // Starting a new project, noop
            return {
                src,
                dist: `${dist}-${type}`,
                config: {},
                spineList: [],
                spineEntries: [],
                tocEntries: [],
            }
        }

        const spine = new Spine({ src, buildType: type })
        const spineList = spine.create(navigationConfigFile)
        const tocEntries = spine.build(spineList, src) // nested navigation
        const spineEntries = spine.flatten(tocEntries) // one-dimensional page flow

        // build-specific config. gets merged into base config during build step
        const config = this.config[type] ? { ...this.config[type] } : {}

        return {
            src,
            dist: `${dist}-${type}`,
            config,
            spineList,
            spineEntries,
            tocEntries,
        }
    }

    loadBuilds() {
        this.buildTypes = {
            sample: this.loadBuildSettings('sample'),
            epub: this.loadBuildSettings('epub'),
            mobi: this.loadBuildSettings('mobi'),
            pdf: this.loadBuildSettings('pdf'),
            web: this.loadBuildSettings('web'),
            reader: this.loadBuildSettings('reader'),
            xml: this.loadBuildSettings('xml'),
        }
    }
}

const state = new State()
export default state
