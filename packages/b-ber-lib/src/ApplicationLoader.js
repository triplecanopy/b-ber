/* eslint-disable import/no-dynamic-require,global-require */

import path from 'path'
import fs from 'fs-extra'
import mime from 'mime-types'
import themes from '@canopycanopycanopy/b-ber-themes'
import log from '@canopycanopycanopy/b-ber-logger'
import Yaml from './Yaml'
import Config from './Config'
import Spine from './Spine'

const cwd = process.cwd()

class ApplicationLoader {
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

    constructor() {
        const scriptPath = path.resolve(__dirname, 'package.json')
        this.npmPackage = JSON.parse(fs.readFileSync(scriptPath), 'utf8')
        this.version = this.npmPackage.version
        this.config = new Config()
    }

    _resetConfig() {
        this._config()
    }

    _config() {
        if (!fs.existsSync(path.join(cwd, 'config.yml'))) return
        const config = new Yaml('config')
        config.load(path.join(cwd, 'config.yml'))

        // not necessary right now to pass around a YAWN instance since we'er
        // not writing back to config.yml, but may be necessary at some point
        this.config = new Config(config.json())
    }

    _metadata() {
        const fpath = path.join(cwd, this.config.src, 'metadata.yml')
        if (!fs.existsSync(fpath)) return

        this.metadata = new Yaml('metadata')
        this.metadata.load(fpath)
    }

    _theme() {
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
            if ((this.theme = require(path.resolve(userThemesPath, this.config.theme)))) {
                log.info(`Loaded theme [${this.config.theme}]`)
                return
            }
        } catch (err) {
            // noop
        }

        // possibly a theme installed with npm, test the project root
        try {
            this.theme = require(path.resolve('node_modules', this.config.theme)) // require.resolve?
        } catch (err) {
            log.warn(`There was an error during require [${this.config.theme}]`)
            log.warn('Using default theme [b-ber-theme-serif]')
            log.warn(err.message)

            // error loading theme, set to default
            this.theme = themes['b-ber-theme-serif']
        }
    }

    _media() {
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

    _builds() {
        this.buildTypes = {
            sample: this._loadBuildSettings('sample'),
            epub: this._loadBuildSettings('epub'),
            mobi: this._loadBuildSettings('mobi'),
            pdf: this._loadBuildSettings('pdf'),
            web: this._loadBuildSettings('web'),
            reader: this._loadBuildSettings('reader'),
            xml: this._loadBuildSettings('xml'),
        }
    }

    _loadBuildSettings(type) {
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

    load() {
        this._config()
        this._metadata()
        this._media()
        this._builds()
        this._theme()
    }
}

export default ApplicationLoader
