/* eslint-disable import/no-dynamic-require,global-require */

import path from 'path'
import fs from 'fs-extra'
import find from 'lodash/find'
import mime from 'mime-types'
import yargs from 'yargs'
import themes from '@canopycanopycanopy/b-ber-themes'
import log from '@canopycanopycanopy/b-ber-logger'
import Yaml from './Yaml'
import Config from './Config'
import Spine from './Spine'

const cwd = process.cwd()

class ApplicationLoader {
    metadata = []
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
        this.config = new Config()
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
        const themeError = new Error(
            `There was an error loading theme [${this.theme}]`,
        )

        if ({}.hasOwnProperty.call(themes, this.config.theme)) {
            this.theme = themes[this.config.theme]
        } else {
            if (!{}.hasOwnProperty.call(this.config, 'themes_directory')) {
                if (!yargs.argv._[0] || yargs.argv._[0] !== 'theme') {
                    // user is trying to run a command without defining a theme, so bail
                    log.error(
                        "There was an error loading the theme, make sure you've added a [themes_directory] to the [config.yml] if you're using a custom theme.",
                    )
                } else {
                    // user is trying to run a `theme` command, either to set
                    // or list the available themes.  we don't need the
                    // `theme` config object for this operation, so continue
                    // execution
                    this.theme = {}
                    return
                }
            }

            // possibly a user defined theme, test if it exists
            try {
                const userThemesPath = path.resolve(
                    cwd,
                    this.config.themes_directory,
                )
                const userThemes = fs
                    .readdirSync(userThemesPath)
                    .reduce((acc, curr) => {
                        if (
                            !fs
                                .lstatSync(path.resolve(userThemesPath, curr))
                                .isDirectory()
                        ) {
                            return acc
                        }
                        const themePath = fs.existsSync(
                            path.resolve(userThemesPath, curr, 'package.json'),
                        )
                            ? path.resolve(userThemesPath, curr)
                            : path.resolve(userThemesPath, curr, 'index.js')

                        const userModule = require(themePath)
                        return acc.concat(userModule)
                    }, [])

                const userTheme = find(userThemes, { name: this.config.theme })
                if (!userTheme) {
                    log.error(`Could not find theme [${this.config.theme}]`)
                }

                // exists! set it
                this.theme = userTheme
                return
            } catch (err) {
                log.error(themeError)
            }
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
                throw new Error(
                    `Project directory [${projectDir}] does not exist`,
                )
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
