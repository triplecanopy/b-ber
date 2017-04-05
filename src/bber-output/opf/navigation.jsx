
/**
 * Scans directory contents and reads YAML files to create the `spine` and
 * `guide` elements in the `content.opf`. Writes essential navigation
 * documents (`toc.ncx`, `toc.xhtml`) to the output directory
 * @module navigation
 * @see {@link module:navigation#Navigation}
 */

// vendor
import renderLayouts from 'layouts'
import path from 'path'
import fs from 'fs-extra'
import File from 'vinyl'
import rrdir from 'recursive-readdir'
import YAML from 'yamljs'
import { findIndex, difference, uniq } from 'lodash'

// utility
import Props from 'bber-lib/props'
import { log } from 'bber-plugins'
import { src, dist, build, promiseAll } from 'bber-utils'

// templates
import { tocTmpl, tocItem } from 'bber-templates/toc-xhtml'
import { ncxTmpl, navPoint } from 'bber-templates/toc-ncx'
import { opfGuide, opfSpine, guideItems, spineItems } from 'bber-templates/opf'

// helpers
import { pathInfoFromFiles, flattenYamlEntries, removeNestedArrayItem,
  createPagesMetaYaml, nestedLinearContent, buildNavigationObjects,
  sortNavigationObjects } from 'bber-output/opf/helpers'

/**
 * @alias module:navigation#Navigation
 */
class Navigation {
  get src() { // eslint-disable-line class-methods-use-this
    return src()
  }

  get dist() { // eslint-disable-line class-methods-use-this
    return dist()
  }

  get build() { // eslint-disable-line class-methods-use-this
    return build()
  }

  /**
   * [constructor description]
   * @constructor
   * @return {Object}
   */
  constructor() {
    this.navdocs = [
      'toc.ncx',
      'toc.xhtml'
    ]
  }

  /**
   * Remove the `toc.xhtml` and `toc.ncx` from the output directory
   * @return {Promise<Object|Error>}
   */
  unlinkExistingNavDocuments() {
    return new Promise(resolve/* , reject */ =>
      this.navdocs.forEach((file, idx) =>
        fs.remove(
          path.join(this.dist, 'OPS', file), (err1) => {
            if (err1) { throw err1 }
            return fs.writeFile(
              path.join(this.dist, 'OPS', file), '', (err2) => {
                if (err2) { throw err2 }
                if (idx === this.navdocs.length - 1) { resolve() }
              }
            )
          }
        )
      )
    )
  }

  /**
   * Ensure build variables are set before execution
   * @return {Promise<Object|Error>}
   */
  // initialize = () => {
  //   input = src()
  //   this.dist = dist()
  //   buildType = build()
  //   return Promise.resolve()
  // }

  /**
   * Retrieve a list of all XHTML files in the output directory
   * @return {Promise<Object|Error>}
   */
  getAllXhtmlFiles() {
    return new Promise((resolve, reject) =>
      rrdir(`${this.dist}/OPS`, (err, filearr) => {
        if (err) { reject(err) }
        // TODO: better testing here, make sure we're not including symlinks, for example
        const fileObjects = pathInfoFromFiles(filearr, this.dist)
        // only get html files
        const xhtmlFileObjects = fileObjects.filter(_ => Props.isHTML(_))
        // prepare for diffing
        const filesFromSystem = uniq(xhtmlFileObjects.map(_ => path.basename(_.name, _.extension)))
        resolve({ filesFromSystem, fileObjects })
      })
    )
  }

  addMissingEntriesToNonLinearSection(arr, missingEntries) { // eslint-disable-line class-methods-use-this
    let nonLinearIndex = findIndex(arr, 'nonLinear')
    if (nonLinearIndex < 0) { nonLinearIndex = (arr.push({ nonLinear: [] })) - 1 }
    missingEntries.forEach(_ => arr[nonLinearIndex].nonLinear.push(`${_}.xhtml`))
    return arr
  }

  readYamlConfigFiles(resp) {
    return new Promise((resolve/* , reject */) => {
      const yamlpath = path.join(this.src, `${this.build}.yml`)
      let filesFromYaml = []
      try {
        if (fs.existsSync(yamlpath)) {
          const entries = YAML.load(yamlpath) || []
          const flattenedEntries = uniq(
            flattenYamlEntries(entries).map(_ => path.basename(_, '.xhtml'))
          )

          // we need both `flattenedEntries` for comparison, and `entries` which
          // contains page hierarchy
          filesFromYaml = { entries, flattenedEntries }
        } else {
          throw new Error(`[${this.build}.yml] not found. Creating default file.`)
        }
      } catch (err) {
        if (err.message.match(/Creating default file/)) {
          log.warn(err.message)
          createPagesMetaYaml(this.src, this.build)
        } else {
          log.error(err)
        }
      }

      resolve({ filesFromYaml, ...resp })
    })
  }

  /**
   * Resolve discrepancies between files that exist in the output directory and
   * those that are listed in the YAML manifest
   * @param  {Array} filesFromSystem XHTML files in the output directory
   * @param  {Array} filesFromYaml   Entries in the YAML manifest
   * @return {Promise<Object<Array>|Error>}
   */

  // TODO: destructure arrays in args
  compareXhtmlWithYaml([allXhtmlFiles, yamlConfigFiles]) {
    return new Promise((resolve/* , reject */) => {
      const { filesFromSystem, fileObjects } = allXhtmlFiles
      const { filesFromYaml } = yamlConfigFiles
      const { entries, flattenedEntries } = filesFromYaml
      const pages = Array.prototype.slice.call(entries, 0)
      const flow = flattenedEntries // one-dimensional flow of the book used for the spine

      // check that all entries are accounted for
      const pagediff = difference(flattenedEntries, filesFromSystem) // missing files
      const filediff = difference(filesFromSystem, flattenedEntries) // missing entries

      if (pagediff.length || filediff.length) {
        // there are discrepencies between the files on the system and files
        // declared in the `this.build`.yml file
        if (pagediff.length) {
          // there are extra entries in the YAML (i.e., missing XHTML pages)
          log.warn(`XHTML pages for ${this.build}.yml do not exist:`)
          log.warn(pagediff.map(_ => `${_}.xhtml`))
          log.warn(`Removing redundant entries in ${this.build}.yml`)

          // cycle through the diff to remove redundant entries. called with
          // lodash#remove, which mutates, so no need to re-assign
          pagediff.forEach((_) => {
            removeNestedArrayItem(pages, `${_}.xhtml`)

            const refIndex = flow.indexOf(_)
            if (refIndex > -1) { flow.splice(refIndex, 1) }
          })
        }

        if (filediff.length) {
          // there are missing entries in the YAML (i.e., extra XHTML pages),
          // but we don't know where to interleave them. we add them to the
          // manifest so that the ebook validates, but keep them hidden from the
          // flow of the book
          log.warn(`Missing entries in ${this.build}.yml files:`)
          log.warn(filediff.map(_ => `${_}.xhtml`))
          log.warn(`Adding missing entries as [non-linear] content to [${this.build}.yml]`)

          // prefer not to mutate `pages`, but may as well keep consistent behaviour as above ...
          this.addMissingEntriesToNonLinearSection(pages, filediff)
        }
      }

      // finally, remove all non-linear content from `flow` since we don't want
      // it showing up in the spine. this is _not_ the same as `linear="no"`,
      // meaning that any hyperlinks in the document to these pages will
      // invalidate the ebook.
      const nonLinearIndex = findIndex(pages, 'nonLinear')
      if (nonLinearIndex > -1) {
        pages[nonLinearIndex].nonLinear.forEach((_) => {
          const ref = _.replace(/\.xhtml$/, '')
          const refIndex = flow.indexOf(ref)
          if (refIndex > -1) { flow.splice(refIndex, 1) }
        })
      }

      resolve({ pages, flow, fileObjects, filesFromSystem, filesFromYaml })
    })
  }

  /**
   * Update the YAML manifest with missing entries
   * @param  {Array} options.pages Nested array of XHTML file names
   * @param  {Array} options.flow  One-dimensional array of XHTML file names
   * @return {Promise<Object<Array>|Error>}
   */
  updateConfigFileWithValidAssetPaths({ pages, flow, ...args }) {
    return new Promise((resolve/* , reject */) => {
      const yamlpath = path.join(this.src, `${this.build}.yml`)
      const content = YAML.stringify(pages, Infinity, 2)
      return fs.writeFile(yamlpath, content, (err) => {
        if (err) { throw err }
        resolve({ pages, flow, ...args })
      })
    })
  }

  createTocStringsFromTemplate({ pages, ...args }) {
    return new Promise((resolve/* , reject */) => {
      // TODO: this should use the `fileObjects` object from `args` to build the
      // template
      const strings = {}
      const linearContent = nestedLinearContent(pages)
      const tocObjects = buildNavigationObjects(linearContent, this.dist)
      const tocHTML = tocItem(tocObjects)

      strings.toc = renderLayouts(new File({
        path: './.tmp',
        layout: 'tocTmpl',
        contents: new Buffer(tocHTML)
      }), { tocTmpl })
      .contents
      .toString()

      resolve({ pages, strings, ...args })
    })
  }

  createNcxStringsFromTemplate({ pages, ...args }) {
    return new Promise((resolve/* , reject */) => {
      // TODO: this should use the `fileObjects` object from `args` to build the
      // template
      const strings = {}
      const linearContent = nestedLinearContent(pages)
      const ncxObjects = buildNavigationObjects(linearContent, this.dist)
      const ncxXML = navPoint(ncxObjects)

      strings.ncx = renderLayouts(new File({
        path: './.tmp',
        layout: 'ncxTmpl',
        contents: new Buffer(ncxXML)
      }), { ncxTmpl })
      .contents
      .toString()

      resolve({ pages, strings, ...args })
    })
  }

  createGuideStringsFromTemplate({ flow, fileObjects, ...args }) { // eslint-disable-line class-methods-use-this
    return new Promise((resolve/* , reject */) => {
      const strings = {}
      const orderedFileObjects = sortNavigationObjects(flow, fileObjects)
      const guideXML = guideItems(orderedFileObjects)

      strings.guide = renderLayouts(new File({
        path: './.tmp',
        layout: 'opfGuide',
        contents: new Buffer(guideXML)
      }), { opfGuide })
      .contents
      .toString()

      resolve({ strings, flow, fileObjects, ...args })
    })
  }

  createSpineStringsFromTemplate({ flow, fileObjects, ...args }) { // eslint-disable-line class-methods-use-this
    return new Promise((resolve/* , reject */) => {
      const strings = {}
      const orderedFileObjects = sortNavigationObjects(flow, fileObjects)
      const spineXML = spineItems(orderedFileObjects)

      strings.spine = renderLayouts(new File({
        path: './.tmp',
        layout: 'opfSpine',
        contents: new Buffer(spineXML)
      }), { opfSpine })
      .contents
      .toString()

      resolve({ strings, flow, fileObjects, ...args })
    })
  }

  /**
   * Returns a new object from an array of return values from `Promise.all`.
   * Deep merges a single property passed in as `property`. Uses `Object.assign`
   * @param  {Array<Object>} args  The objects to merge
   * @param  {String} property     The properties of `args` to merge
   * @return {Object}              Deep merged object
   */
  deepMergePromiseArrayValues(args, property) { // eslint-disable-line class-methods-use-this
    const argsArray = args.map(_ => _)
    const propsArray = args.map(_ => _[property])
    const props = Object.assign({}, ...propsArray)
    return Object.assign({}, ...argsArray, { [property]: props })
  }

  writeTocXhtmlFile(args) {
    return new Promise((resolve/* , reject */) => {
      const result = this.deepMergePromiseArrayValues(args, 'strings')
      const { toc } = result.strings
      const filepath = path.join(this.dist, 'OPS', 'toc.xhtml')
      fs.writeFile(filepath, toc, (err) => {
        if (err) { throw err }
        resolve(result)
      })
    })
  }

  writeTocNcxFile(args) {
    return new Promise((resolve/* , reject */) => {
      const result = this.deepMergePromiseArrayValues(args, 'strings')
      const { ncx } = result.strings
      const filepath = path.join(this.dist, 'OPS', 'toc.ncx')
      fs.writeFile(filepath, ncx, (err) => {
        if (err) { throw err }
        resolve(result)
      })
    })
  }

  normalizeResponseObject(args) {
    return new Promise((resolve/* , reject */) => {
      const normalizedResponse = this.deepMergePromiseArrayValues(args, 'strings')
      resolve(normalizedResponse)
    })
  }

  /**
   * Initialize promise chain to build ebook navigation structure
   * @return {Promise<Object|Error>}
   */
  init() {
    return new Promise(resolve/* , reject */ =>
      this.unlinkExistingNavDocuments()
      .then(resp => promiseAll([
        this.getAllXhtmlFiles(resp),
        this.readYamlConfigFiles(resp)
      ]))
      .then(resp => this.compareXhtmlWithYaml(resp))
      .then(resp => this.updateConfigFileWithValidAssetPaths(resp))
      .then(resp => promiseAll([
        this.createTocStringsFromTemplate(resp),
        this.createNcxStringsFromTemplate(resp),
        this.createGuideStringsFromTemplate(resp),
        this.createSpineStringsFromTemplate(resp)
      ]))
      .then(resp => promiseAll([
        // the two following methods both merge the results from `Promise.all`
        // and return identical new objects containing all navigation
        // information to the next method in the chain
        this.writeTocXhtmlFile(resp),
        this.writeTocNcxFile(resp)
      ]))
      // merge the values from the arrays returned above and pass the response
      // along to write the `content.opf`
      .then(resp => this.normalizeResponseObject(resp))
      // .then(createNavigationXML)
      .catch(err => log.error(err))
      .then(resolve)
    )
  }
}

export default Navigation
