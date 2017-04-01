/* eslint-disable class-methods-use-this */

 /**
 * Returns an instance of the Generate class
 * @see {@link module:generate#Generate}
 * @return {Generate}
 */

import fs from 'fs-extra'
import yargs from 'yargs'
import path from 'path'
import YAML from 'yamljs'
import File from 'vinyl'
import { log } from 'bber-plugins'
import { orderByFileName, entries, lpad, src } from 'bber-utils'

/**
 * Generate new Markdown documents
 * @alias module:generate#Generate
 */
class Generate {
  /**
   * Get a list of markdown files
   * @return {Array<Object<String>>}
   */
  getFiles() {
    return new Promise(resolve =>
      fs.readdir(path.join(src(), '_markdown'), (err, files) => {
        if (err) { throw err }
        let filearr = files.map((_) => {
          if (path.basename(_).charAt(0) === '.') { return null }
          return { name: _ }
        }).filter(Boolean)
        filearr = filearr.length ? filearr : []
        resolve(filearr)
      })
    )
  }

  /**
   * Order files based on their filename
   * @param  {Array<Object<String>>} files [description]
   * @return {Array<Object<String>>}
   */
  orderFiles(files) {
    return new Promise(resolve =>
      resolve(orderByFileName(files))
    )
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
   * Create a new vinyl file object with frontmatter
   * @param  {Array} options.files      [description]
   * @param  {Object} options.metadata  [description]
   * @return {Object} The filename, the file object, and the metadata
   */
  createFile({ files, metadata }) {
    let frontmatter = ''
    for (const [key, val] of entries(metadata)) {
      if (key && val) { frontmatter += `${key}: ${val}\n` }
    }
    frontmatter = `---\n${frontmatter}---\n`

    return new Promise((resolve) => {
      const fname = `${lpad(String(files.length + 1), '0', 5)}.md`
      const file = new File({
        path: './',
        contents: new Buffer(frontmatter)
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
      fs.writeFile(
          path.join(src(), '_markdown', fname),
          String(file.contents),
          (err) => {
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
    return new Promise((resolve, reject) => { // eslint-disable-line consistent-return
      const buildTypes = ['epub', 'mobi', 'web', 'sample']
      let type
      while ((type = buildTypes.pop())) {
        const pages = path.join(src(), `${type}.yml`)
        let pagemeta = []
        try {
          if (fs.statSync(pages)) {
            pagemeta = YAML.load(path.join(src(), `${type}.yml`)) || []
          }
        } catch (e) {
          log.info(`Creating ${type}.yml`)
          fs.writeFileSync(path.join(src(), `${type}.yml`), '---')
        }

        const index = pagemeta.indexOf(fname)
        if (index > -1) {
          const err = `${fname} already exists in [${type}.yml]. Aborting`
          log.error(err)
          return reject(err)
        }

        // TODO: this should add the new file to <type>.yml JSON object and
        // then rewrite to disk
        fs.appendFile(pages, `\n- ${path.basename(fname, '.md')}.xhtml`, (err) => { // eslint-disable-line consistent-return
          if (err) { throw err }
          if (!buildTypes.length) {
            return resolve({ title: fname })
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
      new Promise(resolve/* , reject */ =>
        this.getFiles()
        .then(this.orderFiles)
        .then(this.parseMeta)
        .then(this.createFile)
        .then(this.writeFile)
        .then(this.writePageMeta)
        .catch(err => log.error(err))
        .then(resolve)
      )
  }
}

const generate = process.env.NODE_ENV === 'test' ? Generate : new Generate().init()
export default generate
