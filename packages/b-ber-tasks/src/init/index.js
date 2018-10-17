import fs from 'fs-extra'
import path from 'path'
import log from '@canopycanopycanopy/b-ber-logger'
import state from '@canopycanopycanopy/b-ber-lib/State'
import getAssets from '@canopycanopycanopy/b-ber-resources'
import Project from '@canopycanopycanopy/b-ber-templates/Project'

/**
 * @class Initializer
 */
class Initializer {
    /**
     * @constructor
     * @param  {Object} argv Command Line arguments
     * @return {Object}
     */
    constructor({ cwd = '', argv = { src: '_project', dist: 'project' } }) {
        const { src, dist } = argv

        if (!cwd) throw new Error('Base directory not provided')
        if (!src || !dist) { throw new Error('Both [src] and [dist] arguments must be provided') }
        if (src === dist) {
            throw new Error(
                '[src] and [dist] directories must have different names',
            )
        }

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

    makeDirs() {
        const promises = this.dirs.map(a => fs.mkdirp(a))
        return Promise.all(promises)
    }

    writeFiles() {
        const promises = this.files.map(a =>
            fs.writeFile(a.relativePath, a.content),
        )
        return Promise.all(promises)
    }

    copyImages() {
        return getAssets().then(assets => {
            const {
                'b-ber-logo': bberLogo,
                'default-publishers-logo': publishersLogo,
            } = assets
            const images = [bberLogo, publishersLogo]

            log.info('Copying development assets')

            const promises = images.map(a =>
                fs.copy(
                    a,
                    path.join(this.projectPath, '_images', path.basename(a)),
                ),
            )
            return Promise.all(promises)
        })
    }

    /**
     * Write default directories and files to the source directory
     * @param  {String} name Name of the project
     * @return {Promise<Object|Error>}
     */
    start(name = '') {
        this.makeDirs()
            .then(() => this.writeFiles())
            .then(() => this.copyImages())
            .then(() => log.notice(`Created new project [${name}]`))
            .catch(log.error)
    }
}

export default Initializer
