import path from 'path'
import fs from 'fs-extra'
import find from 'lodash/find'
import mime from 'mime-types'
import yargs from 'yargs'
import themes from '@canopycanopycanopy/b-ber-themes'
import log from '@canopycanopycanopy/b-ber-logger'
import YamlAdaptor from './YamlAdaptor'
import {createPageModelsFromYAML, flattenNestedEntries} from './helpers'

const cwd = process.cwd()

class ApplicationLoader {
    static defaults = {
        version: '',
        config: {
            env: process.env.NODE_ENV || 'development',
            src: '_project',
            dist: 'project',
            ibooks_specified_fonts: false,
            theme: 'b-ber-theme-serif',
            themes_directory: './themes',
            baseurl: '/',
            autoprefixer_options: {
                browsers: ['last 2 versions', '> 2%'],
                flexbox: 'no-2009',
            },
        },
        metadata: [],
        video: [],
        audio: [],
        buildTypes: { sample: {}, epub: {}, mobi: {}, pdf: {}, web: {}},
    }
    constructor() {
        this.__MODULE_PATH__ = path.dirname(__dirname)
        this.__PACKAGE_JSON__ = require(path.join(this.__MODULE_PATH__, 'package.json')) // eslint-disable-line import/no-dynamic-require,global-require

        Object.entries(ApplicationLoader.defaults).forEach(([key, val]) => this[key] = val)
    }

    __version() {
        const {version} = this.__PACKAGE_JSON__
        this.version = version
    }

    __config() {
        if (!fs.existsSync(path.join(cwd, 'config.yml'))) return
        this.config = {...this.config, ...YamlAdaptor.load(path.join(cwd, 'config.yml'))}
    }

    __metadata() {
        const fpath = path.join(cwd, this.config.src, 'metadata.yml')
        if (!fs.existsSync(fpath)) return
        this.metadata = [...this.metadata, ...YamlAdaptor.load(fpath)]
    }

    __theme() {
        const themeError = new Error(`There was an error loading theme [${this.theme}]`)

        if ({}.hasOwnProperty.call(themes, this.theme)) {
            this.theme = themes[this.theme]
        } else {
            if (!{}.hasOwnProperty.call(this.config, 'themes_directory')) {
                if (!yargs.argv._[0] || yargs.argv._[0] !== 'theme') {
                    // user is trying to run a command without defining a theme, so bail
                    log.error('There was an error loading the theme, make sure you\'ve added a [themes_directory] to the [config.yml] if you\'re using a custom theme.')
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
                const userThemesPath = path.resolve(cwd, this.config.themes_directory)
                const userThemes = fs.readdirSync(userThemesPath).reduce((acc, curr) => {
                    if (!fs.lstatSync(path.resolve(userThemesPath, curr)).isDirectory()) return acc
                    const userModule =
                        fs.existsSync(path.resolve(userThemesPath, curr, 'package.json'))
                            ? require(path.resolve(userThemesPath, curr)) // eslint-disable-line import/no-dynamic-require,global-require
                            : require(path.resolve(userThemesPath, curr, 'index.js')) // eslint-disable-line import/no-dynamic-require,global-require
                    return acc.concat(userModule)
                }, [])


                const userTheme = find(userThemes, {name: this.config.theme})
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

    __media() {
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

    __builds() {
        this.buildTypes = {
            sample: this.__loadFromFileOrDefaultSettings('sample'),
            epub: this.__loadFromFileOrDefaultSettings('epub'),
            mobi: this.__loadFromFileOrDefaultSettings('mobi'),
            pdf: this.__loadFromFileOrDefaultSettings('pdf'),
            web: this.__loadFromFileOrDefaultSettings('web'),
        }
    }

    __loadFromFileOrDefaultSettings(type) {
        const {src, dist} = this.config
        const yamlPath = path.join(cwd, src, `${type}.yml`)

        let spineList = []
        let spineEntries = []
        let tocEntries = []

        try {
            if (fs.existsSync(yamlPath)) {
                spineList = YamlAdaptor.load(yamlPath) || []
                tocEntries = createPageModelsFromYAML(spineList, src) // nested navigation
                spineEntries = flattenNestedEntries(tocEntries) // one-dimensional page flow
            } else {
                throw new Error(`[${type}.yml] not found. Creating default file.`)
            }
        } catch (err) {
            if (/Creating default file/.test(err.message)) {
                // log.info(err.message)
                // createPagesMetaYaml(src, type)
            } else {
                throw err
            }
        }

        return {
            src,
            dist: `${dist}-${type}`,
            spineList,
            spineEntries,
            tocEntries,
        }
    }

    load() {
        this.__version()
        this.__config()
        this.__metadata()
        this.__theme()
        this.__media()
        this.__builds()
    }
}


export default ApplicationLoader
