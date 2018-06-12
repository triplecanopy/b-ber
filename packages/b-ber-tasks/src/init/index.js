import fs from 'fs-extra'
import path from 'path'
import log from '@canopycanopycanopy/b-ber-logger'
import state from '@canopycanopycanopy/b-ber-lib/State'
import getAssets from '@canopycanopycanopy/b-ber-resources'
import {setTheme} from '@canopycanopycanopy/b-ber-lib/theme'
import Project from '@canopycanopycanopy/b-ber-templates/Project'

/**
 * @class Initializer
 */
class Initializer {
    set src(val) { this._src = val }
    set dist(val) { this._dist = val }
    set cwd(val) { this._cwd = val }
    set dirs(val) { this._dirs = val }
    set files(val) { this._files = val }
    set projectPath(val) { this._projectPath = val }

    get src() { return this._src }
    get dist() { return this._dist }
    get cwd() { return this._cwd }
    get dirs() { return this._dirs }
    get files() { return this._files }
    get projectPath() { return this._projectPath }

    /**
     * @constructor
     * @param  {Object} argv Command Line arguments
     * @return {Object}
     */
    constructor({cwd = '', argv = {src: '_project', dist: 'project'}}) {
        const {src, dist} = argv

        if (!cwd) throw new Error('Base directory not provided')
        if (!src || !dist) throw new Error('Both [src] and [dist] arguments must be provided')
        if (src === dist) throw new Error('[src] and [dist] directories must have different names')

        this.cwd = cwd
        this.src = src
        this.dist = dist

        this.projectPath = path.join(this.cwd, this.src)
        this.buildTypes = ['epub', 'mobi', 'pdf', 'sample', 'web']
        this.dirs = Project.directories(this.projectPath)

        this.files = [
            ...this.buildTypes.map(a => Project.typeYAML(this.projectPath, a)),
            Project.configYAML(this.projectPath, state.config.dist),
            Project.metadataYAML(this.projectPath),
            ...Project.javascripts(this.projectPath),
            ...Project.stylesheets(this.projectPath),
            ...Project.markdown(this.projectPath),
            Project.readme(this.projectPath, cwd),
            Project.gitignore(this.projectPath),
        ]
    }

    /**
     * [_makeDirs description]
     * @return {Promise<Object|Error>}
     */
    _makeDirs() {
        return new Promise(resolve => {
            const promises = this.dirs.map(a => fs.mkdirp(a))
            return Promise.all(promises).then(resolve)
        })
    }

    /**
     * [_writeFiles description]
     * @return {Promise<Object|Error>}
     */
    _writeFiles() {
        return new Promise(resolve => {
            const promises = this.files.map(a => fs.writeFile(a.relativePath, a.content))
            return Promise.all(promises).then(resolve)
        })
    }

    _copyImages() {
        return new Promise(resolve => {
            const promises = []
            getAssets().then(assets => {
                const {'b-ber-logo': bberLogo, 'default-publishers-logo': publishersLogo} = assets
                const images = [bberLogo, publishersLogo]

                log.info('Copying development assets')
                images.forEach(a => promises.push(fs.copy(a, path.join(this.projectPath, '_images', path.basename(a)))))
                Promise.all(promises).then(resolve)
            })
        })

    }
    _setTheme() {
        log.info('Setting default theme')
        return new Promise(resolve => setTheme(
            state.theme.name,
            [state.theme.name],
            [],
            path.dirname(this.projectPath)
        ).then(resolve))
    }

    /**
     * Write default directories and files to the source directory
     * @param  {String} name Name of the project
     * @return {Promise<Object|Error>}
     */
    start(name = '') {
        return new Promise(resolve =>
            this._makeDirs()
                .then(() => this._writeFiles())
                .then(() => this._copyImages())
                .then(() => this._setTheme())
                .then(() => console.log(`Created new project [${name}]`)) // bber logger may not available?
                .catch(err => log.error(err))
                .then(resolve)
        )
    }
}

export default Initializer
