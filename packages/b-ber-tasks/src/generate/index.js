/* eslint-disable class-methods-use-this */

/**
 * Returns an instance of the Generate class
 * @see {@link module:generate#Generate}
 * @return {Generate}
 */


import path from 'path'
import fs from 'fs-extra'
import yargs from 'yargs'
import File from 'vinyl'
import YamlAdaptor from '@canopycanopycanopy/b-ber-lib/YamlAdaptor'
import log from '@canopycanopycanopy/b-ber-logger'
import state from '@canopycanopycanopy/b-ber-lib/State'

/**
 * Generate new Markdown documents
 * @alias module:generate#Generate
 */
class Generate {
    /**
     * Get a list of markdown files
     * @param  {String} dir [description]
     * @return {Array<Object<String>>}
     */
    getFiles(dir) {
        return new Promise(resolve => {
            const d = dir || path.join(state.src, '_markdown')
            try {
                fs.existsSync(d)
            } catch (e) {
                throw e
            }
            return fs.readdir(d, (err, files) => {
                if (err) throw err
                const filearr = files.map(name => {
                    if (path.basename(name).charAt(0) === '.') return null
                    return {name}
                }).filter(Boolean)
                resolve(filearr)
            })
        })
    }

    /**
     * Get an array of files' frontmatter
     * @param  {Array} files [description]
     * @return {Object}       The array of files and their corresponding frontmatter
     */
    parseMeta(files) {
        return new Promise(resolve => {
            const {title, type} = yargs.argv
            const metadata = {title, type}
            resolve({files, metadata})
        })
    }

    /**
     * Template to generate YAML frontmatter
     * @param  {Object} metadata   [description]
     * @return {String} YAML formatted string
     */
    frontmatterYaml(metadata) {
        return Object.entries(metadata).reduce((acc, [k, v]) => acc.concat(`${k}: ${v}\n`), '')
    }

    /**
     * Create a new vinyl file object with frontmatter
     * @param  {Array} options.files      [description]
     * @param  {Object} options.metadata  [description]
     * @return {Object} The filename, the file object, and the metadata
     */
    createFile({metadata}) {
        const frontmatter = `---\n${this.frontmatterYaml(metadata)}---\n`
        return new Promise(resolve => {
            const {title} = metadata
            const fname = `${title.replace(/[^a-z0-9_-]/ig, '-')}.md`

            try {
                if (fs.existsSync(path.join(state.src, '_markdown', fname))) {
                    throw new Error(`_markdown${path.sep}${fname} already exists, aborting`)
                }
            } catch (err) {
                log.error(err)
            }

            const file = new File({
                path: '',
                contents: new Buffer(frontmatter),
            })
            resolve({fname, file, metadata})
        })
    }

    /**
     * Write a vinyl file object's contents to the output directory
     * @param  {String} options.fname [description]
     * @param  {Object} options.file  The vinyl file object
     * @return {Object}               The filename and file object
     */
    writeFile({fname, file}) {
        return new Promise(resolve =>
            fs.writeFile(path.join(state.src, '_markdown', fname), String(file.contents), err => {
                if (err) throw err
                resolve({fname, file})
            })
        )
    }

    /**
     * Append a newly created filename to the yaml manifest
     * @param  {String} options.fname   [description]
     * @return {Promise<Object|Error>}
     */
    writePageMeta({fname}) {
        return new Promise(resolve => { // eslint-disable-line consistent-return
            const buildTypes = ['epub', 'mobi', 'web', 'sample', 'reader']
            let type
            while ((type = buildTypes.pop())) {
                const pages = path.join(state.src, `${type}.yml`)
                let pagemeta = []
                try {
                    if (fs.statSync(pages)) {
                        pagemeta = YamlAdaptor.load(path.join(state.src, `${type}.yml`)) || []
                    }
                } catch (e) {
                    log.info(`Creating ${type}.yml`)
                    fs.writeFileSync(path.join(state.src, `${type}.yml`))
                }

                const index = pagemeta.indexOf(fname)
                if (index > -1) {
                    const err = `${fname} already exists in [${type}.yml]. Aborting`
                    log.error(err)
                    throw err
                }

                // TODO: this should add the new file to <type>.yml JSON object and
                // then rewrite to disk
                fs.appendFile(pages, `\n- ${path.basename(fname, '.md')}`, err => {
                    if (err) throw err
                    if (!buildTypes.length) {
                        resolve({title: fname})
                    }
                })
            }
        })
    }

    /**
     * Create a new markdown file
     * @return {Promise<Object|Error>}
     */
    init() {
        return () =>
            new Promise(resolve =>
                this.getFiles()
                    .then(resp => this.parseMeta(resp))
                    .then(resp => this.createFile(resp))
                    .then(resp => this.writeFile(resp))
                    .then(resp => this.writePageMeta(resp))
                    .catch(err => log.error(err))
                    .then(resolve)
            )
    }
}

const generate = new Generate().init()
export default generate
