/* eslint-disable class-methods-use-this */

 /**
 * Returns an instance of the Generate class
 * @see {@link module:generate#Generate}
 * @return {Generate}
 */

import Promise from 'zousan'
import fs from 'fs-extra'
import yargs from 'yargs'
import path from 'path'
import Yaml from 'bber-lib/yaml'
import File from 'vinyl'
import { log } from 'bber-plugins'
import { lpad, src } from 'bber-utils'

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
    return new Promise((resolve) => {
      const d = dir || path.join(src(), '_markdown')
      try {
        fs.existsSync(d)
      } catch (e) {
        throw e
      }
      return fs.readdir(d, (err, files) => {
        if (err) { throw err }
        let filearr = files.map((_) => {
          if (path.basename(_).charAt(0) === '.') { return null }
          return { name: _ }
        }).filter(Boolean)
        filearr = filearr.length ? filearr : []
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
    return new Promise((resolve) => {
      const { title, type } = yargs.argv
      const metadata = { title, type }
      resolve({ files, metadata })
    })
  }

  /**
   * Template to generate YAML frontmatter
   * @param  {Object} metadata   [description]
   * @return {String} YAML formatted string
   */
  frontmatterYaml(metadata) {
    return Object.entries(metadata).reduce((acc, [k, v]) =>
      acc.concat(`${k}: ${v}\n`)
    , '')
  }

  /**
   * Create a new vinyl file object with frontmatter
   * @param  {Array} options.files      [description]
   * @param  {Object} options.metadata  [description]
   * @return {Object} The filename, the file object, and the metadata
   */
  createFile({ files, metadata }) {
    const frontmatter = `---\n${this.frontmatterYaml(metadata)}---\n`
    return new Promise((resolve) => {
      const fname = `${lpad(String(files.length + 1), '0', 5)}.md`
      const file = new File({
        path: './',
        contents: new Buffer(frontmatter),
      })
      resolve({ fname, file, metadata })
    })
  }

  /**
   * Write a vinyl file object's contents to the output directory
   * @param  {String} options.fname [description]
   * @param  {Object} options.file  The vinyl file object
   * @return {Object}               The filename and file object
   */
  writeFile({ fname, file }) {
    return new Promise(resolve =>
      fs.writeFile(path.join(src(), '_markdown', fname), String(file.contents), (err) => {
        if (err) { throw err }
        resolve({ fname, file })
      })
    )
  }

  /**
   * Append a newly created filename to the yaml manifest
   * @param  {String} options.fname   [description]
   * @return {Promise<Object|Error>}
   */
  writePageMeta({ fname }) {
    return new Promise((resolve) => { // eslint-disable-line consistent-return
      const buildTypes = ['epub', 'mobi', 'web', 'sample']
      let type
      while ((type = buildTypes.pop())) {
        const pages = path.join(src(), `${type}.yml`)
        let pagemeta = []
        try {
          if (fs.statSync(pages)) {
            pagemeta = Yaml.load(path.join(src(), `${type}.yml`)) || []
          }
        } catch (e) {
          log.info(`Creating ${type}.yml`)
          fs.writeFileSync(path.join(src(), `${type}.yml`))
        }

        const index = pagemeta.indexOf(fname)
        if (index > -1) {
          const err = `${fname} already exists in [${type}.yml]. Aborting`
          log.error(err)
          throw err
        }

        // TODO: this should add the new file to <type>.yml JSON object and
        // then rewrite to disk
        fs.appendFile(pages, `\n- ${path.basename(fname, '.md')}`, (err) => { // eslint-disable-line consistent-return
          if (err) { throw err }
          if (!buildTypes.length) {
            resolve({ title: fname })
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

const generate = process.env.NODE_ENV === 'test' ? Generate : new Generate().init()
export default generate
