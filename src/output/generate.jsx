
 /**
 * Returns an instance of the Generate class
 * @module generate
 * @see {@link module:generate#Generate}
 * @return {Generate}
 */

import fs from 'fs-extra'
import yargs from 'yargs'
import path from 'path'
import YAML from 'yamljs'
import File from 'vinyl'
import { log } from 'plugins'
import { orderByFileName, entries, lpad, src } from 'utils'

/**
 * Generate new Markdown documents
 * @alias module:generate#Generate
 */
class Generate {

  // get src() {
  //   return src()
  // }

  /**
   * @constructor
   */
  constructor() {
    this.getFiles = Generate.getFiles
    this.orderFiles = Generate.orderFiles
    this.parseMeta = Generate.parseMeta
    this.createFile = Generate.createFile
    this.writeFile = Generate.writeFile
    this.writePageMeta = Generate.writePageMeta
  }

  /**
   * Get a list of markdown files
   * @return {Array<Object<String>>}
   */
  static getFiles() {
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
   * @param  {Array<Object<String>>} files
   * @return {Array<Object<String>>}
   */
  static orderFiles(files) {
    return new Promise(resolve =>
      resolve(orderByFileName(files))
    )
  }

  /**
   * Get an array of files' frontmatter
   * @param  {Array} files [description]
   * @return {Object}       The array of files and their corresponding frontmatter
   */
  static parseMeta(files) {
    return new Promise((resolve) => {
      const { section_title, landmark_type, landmark_title } = yargs.argv
      const metadata = { section_title, landmark_type, landmark_title }
      resolve({ files, metadata })
    })
  }

  /**
   * Create a new vinyl file object with frontmatter
   * @param  {Array} options.files
   * @param  {Object} options.metadata
   * @return {Object} The filename, the file object, and the metadata
   */
  static createFile({ files, metadata }) {
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
   * @param  {String} options.fname
   * @param  {Object} options.file  The vinyl file object
   * @return {Object}               The filename and file object
   */
  static writeFile({ fname, file }) {
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
   * @param  {String} options.fname
   * @return {Promise<Object|Error>}
   */
  static writePageMeta({ fname }) {
    return new Promise((resolve, reject) => {
      const buildTypes = ['epub', 'mobi', 'web', 'sample']
      let type
      while ((type = buildTypes.pop())) {
        const pages = path.join(src(), `${type}.yml`)
        let pagemeta = []
        try {
          if (fs.statSync(pages)) {
            pagemeta = YAML.load(path.join(src(), `${type}.yml`))
          }
        } catch (e) {
          log.info(`Creating ${type}.yml`)
          fs.writeFileSync(path.join(src(), `${type}.yml`), '---')
        }

        const index = pagemeta.indexOf(fname)
        if (index > -1) {
          const err = `${fname} already exists in \`${type}.yml\`. Aborting`
          log.error(err)
          return reject(err)
        }

        // TODO: this should add the new file to <type>.yml JSON object and
        // then rewrite to disk
        fs.appendFile(pages, `\n- ${path.basename(fname, '.md')}.xhtml`, (err) => {
          if (err) { throw err }
          if (!buildTypes.length) { resolve({ title: fname }) }
        })
      }
    })
  }

  /**
   * Create a new markdown file
   * @return {Promise<Object|Error>}
   */
  init() {
    return new Promise(resolve/* , reject */ =>
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

const generate = Generate
export default generate
