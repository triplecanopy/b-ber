import crypto from 'crypto'
import isPlainObject from 'lodash/isPlainObject'
import isArray from 'lodash/isArray'
import findIndex from 'lodash/findIndex'
import set from 'lodash/set'
import get from 'lodash/get'
import merge from 'lodash/merge'
import remove from 'lodash/remove'
import path from 'path'
import fs from 'fs-extra'
import mime from 'mime-types'
import themes from '@canopycanopycanopy/b-ber-themes'
import log from '@canopycanopycanopy/b-ber-logger'
import Yaml from './Yaml'
import Config from './Config'
import Spine from './Spine'

const cwd = process.cwd()
const randomHash = () => crypto.randomBytes(20).toString('hex')

const SRC_DIR_IMAGES = '_images'
const SRC_DIR_MARKDOWN = '_markdown'
const SRC_DIR_STYLESHEETS = '_stylesheets'
const SRC_DIR_JAVASCRIPTS = '_javascripts'
const SRC_DIR_FONTS = '_fonts'
const SRC_DIR_MEDIA = '_media'

const DIST_DIR_OPS = 'OPS'
const DIST_DIR_TEXT = 'text'
const DIST_DIR_IMAGES = 'images'
const DIST_DIR_STYLESHEETS = 'stylesheets'
const DIST_DIR_JAVASCRIPTS = 'javascripts'
const DIST_DIR_FONTS = 'fonts'
const DIST_DIR_MEDIA = 'media'

class State {
    static get defaults() {
        return {
            build: 'epub',
            sequence: [],
            hash: randomHash(),
        }
    }

    metadata = { json: () => [{}] }
    theme = {}
    video = []
    audio = []
    build = 'epub'
    sequence = []
    hash = randomHash()
    builds = {
        sample: {},
        epub: {},
        mobi: {},
        pdf: {},
        web: {},
        reader: {},
    }

    get spine() {
        return this.builds[this.build].spine
    }

    set spine(val) {
        this.builds[this.build].spine = val
    }

    get guide() {
        return this.builds[this.build].guide
    }

    set guide(val) {
        this.builds[this.build].guide = val
    }

    get figures() {
        return this.builds[this.build].figures
    }

    set figures(val) {
        this.builds[this.build].figures = val
    }

    get footnotes() {
        return this.builds[this.build].footnotes
    }

    set footnotes(val) {
        this.builds[this.build].footnotes = val
    }

    get cursor() {
        return this.builds[this.build].cursor
    }

    set cursor(val) {
        this.builds[this.build].cursor = val
    }

    get toc() {
        return this.builds[this.build].toc
    }

    set toc(val) {
        this.builds[this.build].toc = val
    }

    get remoteAssets() {
        return this.builds[this.build].remoteAssets
    }

    set remoteAssets(val) {
        this.builds[this.build].remoteAssets = val
    }

    get loi() {
        return this.builds[this.build].loi
    }

    set loi(val) {
        this.builds[this.build].loi = val
    }

    get srcDir() {
        return this.config.src
    }

    set srcDir(val) {
        this.config.src = val
    }

    get distDir() {
        if (this.build && this.builds && this.builds[this.build]) {
            return this.builds[this.build].dist
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

    src = {
        root: (...args) => path.join(this.srcDir, ...args),
        images: (...args) => path.join(this.srcDir, SRC_DIR_IMAGES, ...args),
        markdown: (...args) => path.join(this.srcDir, SRC_DIR_MARKDOWN, ...args),
        stylesheets: (...args) => path.join(this.srcDir, SRC_DIR_STYLESHEETS, ...args),
        javascripts: (...args) => path.join(this.srcDir, SRC_DIR_JAVASCRIPTS, ...args),
        fonts: (...args) => path.join(this.srcDir, SRC_DIR_FONTS, ...args),
        media: (...args) => path.join(this.srcDir, SRC_DIR_MEDIA, ...args),
    }

    dist = {
        root: (...args) => path.join(this.distDir, ...args),
        ops: (...args) => path.join(this.distDir, DIST_DIR_OPS, ...args),
        text: (...args) => path.join(this.distDir, DIST_DIR_OPS, DIST_DIR_TEXT, ...args),
        images: (...args) => path.join(this.distDir, DIST_DIR_OPS, DIST_DIR_IMAGES, ...args),
        stylesheets: (...args) => path.join(this.distDir, DIST_DIR_OPS, DIST_DIR_STYLESHEETS, ...args),
        javascripts: (...args) => path.join(this.distDir, DIST_DIR_OPS, DIST_DIR_JAVASCRIPTS, ...args),
        fonts: (...args) => path.join(this.distDir, DIST_DIR_OPS, DIST_DIR_FONTS, ...args),
        media: (...args) => path.join(this.distDir, DIST_DIR_OPS, DIST_DIR_MEDIA, ...args),
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
        this.loadMetadata()
        this.loadMedia()
        this.loadBuilds()
        this.loadTheme()
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

        log.error(`Cannot add [${val}] to [state.${prop}]`)
    }

    remove(prop, val) {
        if (isArray(this[prop])) {
            const arr = [...this[prop]]
            remove(arr, val)
            this[prop] = arr
            return
        }

        if (isPlainObject(this[prop])) {
            const { [val]: _, ...rest } = this[prop] // eslint-disable-line no-unused-vars
            this[prop] = rest
            return
        }

        log.error(`Cannot remove [${val}] from [state.${prop}]`)
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
                guide: [],
                spine: [],
                toc: [],
                cursor: [],
                figures: [],
                footnotes: [],
                remoteAssets: [],
                loi: [],
            }
        }

        const spine = new Spine({ src, buildType: type, navigationConfigFile })

        // build-specific config. gets merged into base config during build step
        const config = this.config[type] ? { ...this.config[type] } : {}

        return {
            src,
            dist: `${dist}-${type}`,
            config,
            guide: [],
            spine,
            toc: spine.nested,
            cursor: [],
            figures: [],
            footnotes: [],
            remoteAssets: [],
            loi: [],
        }
    }

    loadBuilds() {
        this.builds = {
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
