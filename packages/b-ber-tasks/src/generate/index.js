/* eslint-disable class-methods-use-this */
import path from 'path'
import fs from 'fs-extra'
import YamlAdaptor from '@canopycanopycanopy/b-ber-lib/YamlAdaptor'
import log from '@canopycanopycanopy/b-ber-logger'
import state from '@canopycanopycanopy/b-ber-lib/State'
import sequences from '@canopycanopycanopy/b-ber-shapes/sequences'

// Generate new Markdown documents
class Generate {
    constructor() {
        this.init = this.init.bind(this)
    }

    createFile({ markdownDir, metadata }) {
        const frontmatter = `---\n${Object.entries(metadata).reduce(
            (acc, [k, v]) => (v ? acc.concat(`${k}: ${v}\n`) : acc),
            '',
        )}---\n`

        const { title } = metadata
        const fileName = `${title.replace(/[^a-z0-9_-]/gi, '-')}.md`
        const filePath = path.join(markdownDir, fileName)

        try {
            if (fs.existsSync(filePath)) {
                throw new Error(`_markdown${path.sep}${fileName} already exists, aborting`)
            }
        } catch (err) {
            throw err
        }

        return fs.writeFile(filePath, frontmatter).then(() => ({ fileName }))
    }

    writePageMeta({ fileName }) {
        // TODO: this should eventually just be one 'nav' file that's read from for all builds
        // @issue: https://github.com/triplecanopy/b-ber/issues/225
        const buildTypes = Object.keys(sequences)

        const promises = buildTypes.map(type => {
            const navigationYAML = path.join(state.src, `${type}.yml`)
            const pageMeta = YamlAdaptor.load(path.join(state.src, `${type}.yml`)) || []
            const index = pageMeta.indexOf(fileName)

            if (index > -1) {
                throw new Error(`${fileName} already exists in [${type}.yml]. Aborting`)
            }

            return fs.appendFile(navigationYAML, `\n- ${path.basename(fileName, '.md')}`)
        })

        return Promise.all(promises).then(() => ({ fileName }))
    }

    init(metadata) {
        const markdownDir = path.join(state.src, '_markdown')
        return fs
            .mkdirp(markdownDir)
            .then(() => this.createFile({ markdownDir, metadata }))
            .then(resp => this.writePageMeta(resp))
            .then(({ fileName }) => log.notice(`Generated new page [${fileName}]`))
            .catch(log.error)
    }
}

const generate = new Generate().init
export default generate
