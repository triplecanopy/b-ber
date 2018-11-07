/* eslint-disable class-methods-use-this */

/**
 * Returns an instance of the Generate class
 * @see {@link module:generate#Generate}
 * @return {Generate}
 */

import path from 'path'
import fs from 'fs-extra'
import yargs from 'yargs'
import YamlAdaptor from '@canopycanopycanopy/b-ber-lib/YamlAdaptor'
import log from '@canopycanopycanopy/b-ber-logger'
import state from '@canopycanopycanopy/b-ber-lib/State'

/**
 * Generate new Markdown documents
 * @alias module:generate#Generate
 */
class Generate {
    constructor() {
        this.init = this.init.bind(this)
    }

    createFile({ markdownDir, metadata }) {
        const frontmatter = `---\n${Object.entries(metadata).reduce(
            (acc, [k, v]) => (v ? acc.concat(`${k}: ${v}\n`) : acc),
            ''
        )}---\n`

        const { title } = metadata
        const fileName = `${title.replace(/[^a-z0-9_-]/gi, '-')}.md`
        const filePath = path.join(markdownDir, fileName)

        try {
            if (fs.existsSync(filePath)) {
                throw new Error(
                    `_markdown${path.sep}${fileName} already exists, aborting`
                )
            }
        } catch (err) {
            throw err
        }

        return fs.writeFile(filePath, frontmatter).then(() => ({ fileName }))
    }

    writePageMeta({ fileName }) {
        // TODO: this should eventually just be one 'nav' file that's read from for all builds
        const buildTypes = ['epub', 'mobi', 'web', 'sample', 'reader']

        const promises = buildTypes.map(type => {
            const navigationYAML = path.join(state.src, `${type}.yml`)
            let pageMeta = []

            try {
                if (fs.statSync(navigationYAML)) {
                    pageMeta =
                        YamlAdaptor.load(path.join(state.src, `${type}.yml`)) ||
                        []
                }
            } catch (err) {
                log.info(`Creating ${type}.yml`)
                fs.writeFileSync(path.join(state.src, `${type}.yml`))
            }

            const index = pageMeta.indexOf(fileName)

            if (index > -1) {
                throw new Error(
                    `${fileName} already exists in [${type}.yml]. Aborting`
                )
            }

            return fs.appendFile(
                navigationYAML,
                `\n- ${path.basename(fileName, '.md')}`
            )
        })

        return Promise.all(promises).then(() => ({ fileName }))
    }

    init() {
        const markdownDir = path.join(state.src, '_markdown')
        const { title, type } = yargs.argv
        const metadata = { title, type }

        return fs
            .mkdirp(markdownDir)
            .then(() => this.createFile({ markdownDir, metadata }))
            .then(resp => this.writePageMeta(resp))
            .then(({ fileName }) =>
                log.notice(`Generated new page [${fileName}]`)
            )
            .catch(log.error)
    }
}

const generate = new Generate().init
export default generate
