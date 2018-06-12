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
    constructor() {
        const scriptPath = path.resolve(__dirname, 'package.json')

        this.npmPackage = JSON.parse(fs.readFileSync(scriptPath), 'utf8')

        this.defaultConfig = {
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
            private: false,
            ignore: [],
            autoprefixer_options: {
                browsers: ['last 2 versions', '> 2%'],
                flexbox: 'no-2009',
            },
        }

        this.config = {...this.defaultConfig}

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
        }
    }

    _resetConfig() {
        this.config = {...this.defaultConfig}
    }

    _config() {
        if (!fs.existsSync(path.join(cwd, 'config.yml'))) return
        const userConfig = YamlAdaptor.load(path.join(cwd, 'config.yml'))

        this.config = {...this.config, ...userConfig}
    }

    _metadata() {
        const fpath = path.join(cwd, this.config.src, 'metadata.yml')
        if (!fs.existsSync(fpath)) return
        this.metadata = [...this.metadata, ...YamlAdaptor.load(fpath)]
    }

    _theme() {
        const themeError = new Error(`There was an error loading theme [${this.theme}]`)

        if ({}.hasOwnProperty.call(themes, this.config.theme)) {
            this.theme = themes[this.config.theme]
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
                if (!userTheme) log.error(`Could not find theme [${this.config.theme}]`)

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

    _createSpineListFromMarkdownFiles() {
        const markdownDir = path.join(cwd, this.config.src, '_markdown')
        return fs.readdirSync(markdownDir).filter(a => path.extname(a) === '.md').map(a => path.basename(a, '.md'))
    }

    _createSpineList(navigationConfigFile, type) {
        let spineList = []
        try {
            if (fs.existsSync(navigationConfigFile)) {
                spineList = YamlAdaptor.load(navigationConfigFile) || []
            } else {
                throw new Error(`creating default file [${type}.yml]`)
            }
        } catch (err) {
            if (/creating default file/.test(err.message)) {
                log.warn(err.message)
                fs.writeFileSync(navigationConfigFile, '')
                spineList = this._createSpineListFromMarkdownFiles()
            } else {
                throw err
            }
        }

        return spineList
    }


    _loadBuildSettings(type) {
        const {src, dist} = this.config
        const projectDir = path.join(cwd, src)
        const navigationConfigFile = path.join(cwd, src, `${type}.yml`)

        try {
            if (!fs.existsSync(projectDir)) throw new Error(`Project directory [${projectDir}] does not exist`)
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

        const spineList = this._createSpineList(navigationConfigFile, type)
        const tocEntries = createPageModelsFromYAML(spineList, src) // nested navigation
        const spineEntries = flattenNestedEntries(tocEntries) // one-dimensional page flow

        // build-specific config. gets merged into base config during build step
        const config = this.config[type] ? {...this.config[type]} : {}

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
