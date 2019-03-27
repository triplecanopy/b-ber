import fs from 'fs-extra'
import path from 'path'
import log from '@canopycanopycanopy/b-ber-logger'
import sequences from '@canopycanopycanopy/b-ber-shapes/sequences'
import getAssets from '@canopycanopycanopy/b-ber-resources'
import Project from '@canopycanopycanopy/b-ber-templates/Project'
import state from '@canopycanopycanopy/b-ber-lib/State'
import Theme from '@canopycanopycanopy/b-ber-lib/Theme'
import { ensure } from '@canopycanopycanopy/b-ber-lib/utils'

/**
 * @class Initializer
 */
class Initializer {
    /**
     * @constructor
     * @param  {Object} options Command Line arguments
     * @return {Object}
     */
    constructor({ name = '' }) {
        this.src = '_project'
        this.dist = 'project'
        this.name = name
        this.path = path.join(name, this.src)
        this.builds = Object.keys(sequences)

        if (fs.existsSync(this.path)) {
            log.error(`Project [${name}] already exits, aborting`)
        }
    }

    createAssets = () => {
        const files = [
            ...this.builds.map(a => Project.typeYAML(this.path, a)),
            Project.configYAML(this.path),
            Project.metadataYAML(this.path),
            ...Project.javascripts(this.path),
            ...Project.stylesheets(this.path),
            ...Project.markdown(this.path),
            Project.readme(this.path),
            Project.gitignore(this.path),
        ]

        const dirs = Project.directories(this.path)

        return ensure({ files, dirs, prefix: this.name })
    }

    copyImages() {
        return getAssets().then(assets => {
            const { 'b-ber-logo': bberLogo, 'default-publishers-logo': publishersLogo } = assets
            const images = [bberLogo, publishersLogo]

            log.info('Copying development assets')

            const promises = images.map(a => fs.copy(a, path.join(this.path, '_images', path.basename(a))))
            return Promise.all(promises)
        })
    }

    // eslint-disable-next-line class-methods-use-this
    setTheme() {
        const { theme } = state.config
        process.chdir(this.name)
        return Theme.set(theme, true)
    }

    /**
     * Write default directories and files to the source directory
     * @param  {String} name Name of the project
     * @return {Promise<Object|Error>}
     */
    start() {
        this.createAssets()
            .then(() => this.copyImages())
            .then(() => this.setTheme())
            .then(() => log.notice(`Created new project [${this.name}]`))
            .catch(log.error)
    }
}

export default Initializer
