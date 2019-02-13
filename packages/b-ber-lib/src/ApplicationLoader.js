/* eslint-disable import/no-dynamic-require,global-require */

import path from 'path'
import fs from 'fs-extra'
import mime from 'mime-types'
import themes from '@canopycanopycanopy/b-ber-themes'
import log from '@canopycanopycanopy/b-ber-logger'
import YamlAdaptor from './YamlAdaptor'
import Spine from './Spine'

const cwd = process.cwd()

class ApplicationLoader {
    constructor() {
        const scriptPath = path.resolve(__dirname, 'package.json')

        this.npmPackage = JSON.parse(fs.readFileSync(scriptPath), 'utf8')

        this.initialConfig = {
            env: process.env.NODE_ENV || 'development',
            src: '_project',
            dist: 'project',
            ibooks_specified_fonts: false,
            theme: 'b-ber-theme-serif',
            themes_directory: './themes',
            base_url: '/',
            remote_url: 'http://localhost:4000/',
            reader_url: 'http://localhost:4000/project-reader',
            builds: ['epub', 'mobi', 'pdf'],
            ui_options: {
                navigation: {
                    header_icons: {
                        info: true,
                        home: true,
                        downloads: true,
                        toc: true,
                    },
                    footer_icons: {
                        chapter: true,
                        page: true,
                    },
                },
            },
            private: false,
            ignore: [],
            autoprefixer_options: {
                browsers: ['last 2 versions', '> 2%'],
                flexbox: 'no-2009',
            },
        }

        this.config = { ...this.initialConfig }

        this.version = this.npmPackage.version
        this.metadata = []
        this.theme = {}
        this.video = []
        this.audio = []
        this.buildTypes = {
            sample: {},
            epub: {},
            mobi: {},
            pdf: {},
            web: {},
            reader: {},
        }
    }

    _resetConfig() {
        this.config = { ...this.initialConfig }
    }

    _config() {
        if (!fs.existsSync(path.join(cwd, 'config.yml'))) return
        const userConfig = YamlAdaptor.load(path.join(cwd, 'config.yml'))

        // updates initialConfig with data from config.yml
        this.initialConfig = { ...this.config, ...userConfig }
        this.config = { ...this.initialConfig }
    }

    _metadata() {
        const fpath = path.join(cwd, this.config.src, 'metadata.yml')
        if (!fs.existsSync(fpath)) return
        this.metadata = [...this.metadata, ...YamlAdaptor.load(fpath)]
    }

    _theme() {
        // ensure themes dir exists
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
