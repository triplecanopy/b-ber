
/**
 * Scans directory contents and reads YAML files to create the `spine` and
 * `guide` elements in the `content.opf`. Writes essential navigation
 * documents (`toc.ncx`, `toc.xhtml`) to the output directory
 * @module navigation
 */

import renderLayouts from 'layouts'
import path from 'path'
import fs from 'fs-extra'
import File from 'vinyl'
import rrdir from 'recursive-readdir'
import YAML from 'yamljs'
import { findIndex, difference, uniq } from 'lodash'
import Props from '../../modules/props'
import { log, logg } from '../../log'
import { src, dist, build, promiseAll } from '../../utils'
import { pathInfoFromFiles, flattenYamlEntries, removeNestedArrayItem, createPagesMetaYaml } from './helpers'

import Json2XML from '../../modules/json2xml'
import { tocTmpl, tocItem } from '../../templates/toc-xhtml'

const navdocs = ['toc.ncx', 'toc.xhtml']
let input, output, buildType

/**
 * Remove the `toc.xhtml` and `toc.ncx` from the output directory
 * @return {Promise<Object|Error>}
 */
const unlinkExistingNavDocuments = () =>
  new Promise((resolve, reject) =>
    navdocs.forEach((file, idx) =>
      fs.remove(
        path.join(output, 'OPS', file), (err1) => {
          if (err1) { reject(err1) }
          return fs.writeFile(
            path.join(output, 'OPS', file), '', (err2) => {
              if (err2) { reject(err2) }
              if (idx === navdocs.length - 1) { resolve() }
            }
          )
        }
      )
    )
  )

/**
 * Ensure build variables are set before execution
 * @return {Promise<Object|Error>}
 */
const initialize = () => {
  input = src()
  output = dist()
  buildType = build()
  return Promise.resolve()
}

/**
 * Retrieve a list of all XHTML files in the output directory
 * @return {Promise<Object|Error>}
 */
const getAllXhtmlFiles = () =>
  new Promise((resolve, reject) =>
    rrdir(`${output}/OPS`, (err, filearr) => {
      if (err) { reject(err) }
      // TODO: better testing here, make sure we're not including symlinks, for example
      const fileObjects = pathInfoFromFiles(filearr, output)
      // only get html files
      const xhtmlFileObjects = fileObjects.filter(_ => Props.isHTML(_))
      // prepare for diffing
      const files = uniq(xhtmlFileObjects.map(_ => path.basename(_.name, _.extension)))
      resolve(files)
    })
  )

const addMissingEntriesToNonLinearSection = (arr, missingEntries) => {
  let nonLinearIndex = findIndex(arr, 'nonLinear')
  if (nonLinearIndex < 0) { nonLinearIndex = (arr.push({ nonLinear: [] })) - 1 }
  missingEntries.forEach(_ => arr[nonLinearIndex].nonLinear.push(_))
  return arr
}

const readYamlConfigFiles = () =>
  new Promise((resolve/* , reject */) => {
    const yamlpath = path.join(input, `${buildType}.yml`)
    let result = []
    try {
      if (fs.statSync(yamlpath)) {
        const entries = YAML.load(yamlpath)
        const flattenedEntries = uniq(flattenYamlEntries(entries).map(_ => path.basename(_, '.xhtml')))
        // we need both `flattenedEntries` for comparison, and `entries` which
        // contains page hierarchy
        result = { entries, flattenedEntries }
      }
    } catch (err) {
      log.warn(`\`${buildType}.yml\` not found. Creating default file.`)
      createPagesMetaYaml(input, buildType)
    }
    resolve(result)
  })

/**
 * Resolve discrepancies between files that exist in the output directory and
 * those that are listed in the YAML manifest
 * @param  {Array} filesFromSystem XHTML files in the output directory
 * @param  {Array} filesFromYaml   Entries in the YAML manifest
 * @return {Promise<Object<Array>|Error>}
 */
const compareXhtmlWithYaml = ([filesFromSystem, filesFromYaml]) =>
  new Promise((resolve, reject) => {
    const { entries, flattenedEntries } = filesFromYaml
    const pages = Array.prototype.slice.call(entries, 0)
    const flow = flattenedEntries // one-dimensional flow of the book used for the spine

    // check that all entries are accounted for
    const pagediff = difference(flattenedEntries, filesFromSystem) // missing files
    const filediff = difference(filesFromSystem, flattenedEntries) // missing entries

    if (pagediff.length || filediff.length) {
      // there are discrepencies between the files on the system and files
      // declared in the `buildType`.yml file
      if (pagediff.length) {
        // there are extra entries in the YAML (i.e., missing XHTML pages)
        log.warn(`XHTML pages for ${buildType}.yml do not exist:`)
        log.warn(pagediff.map(_ => `${_}.xhtml`))
        log.warn(`Removing redundant entries in ${buildType}.yml`)

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
        log.warn(`Missing entries in ${buildType}.yml files:`)
        log.warn(filediff.map(_ => `${_}.xhtml`))
        log.warn(`Adding missing entries as \`non-linear\` content to ${buildType}.yml`)

        // prefer not to mutate `pages`, but may as well keep consistent behaviour as above ...
        addMissingEntriesToNonLinearSection(pages, filediff)
      }

    }

    // finally, remove all non-linear content from `flow` since we don't want
    // it showing up in the spine. this is _not_ the same as `linear="no"`,
    // meaning that any hyperlinks in the document to these pages will
    // invalidate the ebook.
    //
    // meaning that non-linear content is parsed separately? probably a better
    // way of handling this, but right now it's handled by
    // `createNavigationStructureAsJavascriptObject`.
    const nonLinearIndex = findIndex(pages, 'nonLinear')
    if (nonLinearIndex > -1) {
      pages[nonLinearIndex].nonLinear.forEach((_) => {
        const ref = _.replace(/\.xhtml$/, '')
        const refIndex = flow.indexOf(ref)
        if (refIndex > -1) { flow.splice(refIndex, 1) }
      })
    }

    resolve({ pages, flow })
  })

/**
 * Update the YAML manifest with missing entries
 * @param  {Array} options.pages Nested array of XHTML file names
 * @param  {Array} options.flow  One-dimensional array of XHTML file names
 * @return {Promise<Object<Array>|Error>}
 */
const updateConfigFileWithValidAssetPaths = ({ pages, flow }) =>
  new Promise((resolve, reject) => {
    const yamlpath = path.join(input, `${buildType}.yml`)
    const content = YAML.stringify(pages, Infinity, 2)
    fs.writeFile(yamlpath, content, (err) => {
      if (err) { reject(err) }
      resolve({ pages, flow })
    })
  })

// // this should recurse through `pages`, adding necessary paths (absolute for
// // node, relative for the ebook) and file names. it should also (probably)
// // assign attributes to the items in the spine (such as `non-linear`).
// //
// // actually, is this even necessary? probably not ...
// const createNavigationStructureAsJavascriptObject = ({ pages, flow }) =>
//   new Promise((resolve, reject) => {
//     resolve()
//   })

const buildNavigationObjects = (data, result = []) => {
  data.forEach((_) => {
    if (Json2XML.isObject(_) && {}.hasOwnProperty.call(_, 'section')) {
      const childIndex = (result.push([])) - 1
      buildNavigationObjects(_.section, result[childIndex])
    } else {
      // TODO: this needs page title (and file path relative to OPS?)
      result.push({ filename: _ })
    }
  })

  return result
}

const createTocStringsFromTemplate = ({ pages, ...args }) =>
  new Promise((resolve/* , reject */) => {
    const strings = {}
    const _pages = Array.prototype.slice.call(pages, 0)
    const nonLinearIndex = findIndex(_pages, 'nonLinear')
    _pages.splice(nonLinearIndex, 1)
    const _tocObjects = buildNavigationObjects(_pages)
    const tocHTML = tocItem(_tocObjects)

    strings.toc = renderLayouts(new File({
      path: './.tmp',
      layout: 'tocTmpl',
      contents: new Buffer(tocHTML)
    }), { tocTmpl })
    .contents
    .toString()

    resolve({ pages, strings, ...args })
  })

const createNcxStringsFromTemplate = ({ pages, ...args }) =>
  new Promise((resolve, reject) => {
    const strings = { ncx: 'foo bar baz' }

    resolve({ strings, ...args })
  })
  // new Promise((resolve, reject) => {
  //   const navpoints = tmpl.navPoint(nav)
  //   const ncxstring = renderLayouts(new File({
  //     path: './.tmp',
  //     layout: 'ncxTmpl',
  //     contents: new Buffer(navpoints)
  //   }), tmpl)
  //   .contents
  //   .toString()
  // })

const createGuideStringsFromTemplate = ({ pages, flow }) => ({})
const createSpineStringsFromTemplate = ({ pages, flow }) => ({})

const writeTocXhtmlFile = data =>
  new Promise((resolve, reject) => {
    // `data[index]` is relative to the order these functions are called in
    // the promise chain below
    const contents = data[0].strings
    const filepath = path.join(output, 'OPS', 'toc.xhtml')
    fs.writeFile(filepath, contents, (err) => {
      if (err) { throw err }
      resolve(data[0])
    })
  })

const writeTocNcxmlFile = data =>
  new Promise((resolve, reject) => {
    const contents = data[1].strings
    const filepath = path.join(output, 'OPS', 'toc.ncx')
    fs.writeFile(filepath, contents, (err) => {
      if (err) { throw err }
      resolve(data[1])
    })
  })

const normalizeResponseObject = data =>
  new Promise((resolve, reject) => {
    const s0 = data[0].strings
    const s1 = data[1].strings

    const strings = Object.assign({}, s0, s1)
    const normalizedResponse = Object.assign({}, data[0], data[1], { strings })
    logg(normalizedResponse)
    resolve(normalizedResponse)
  })

/**
 * Initialize promise chain to build ebook navigation structure
 * @return {Promise<Object|Error>}
 */
const navigation = () =>
  new Promise(resolve/* , reject */ =>
    initialize()
    .then(unlinkExistingNavDocuments)
    .then(() => promiseAll([
      getAllXhtmlFiles(),
      readYamlConfigFiles()
    ]))
    .then(compareXhtmlWithYaml)
    .then(updateConfigFileWithValidAssetPaths)
    // .then(createNavigationStructureAsJavascriptObject)
    .then(resp => promiseAll([
      createTocStringsFromTemplate(resp),
      createNcxStringsFromTemplate(resp),
      createGuideStringsFromTemplate(resp),
      createSpineStringsFromTemplate(resp)
    ]))
    .then(resp => promiseAll([
      // these two following methods could be called async, but nice to keep
      // any errors in the promise chain.
      writeTocXhtmlFile(resp),
      writeTocNcxmlFile(resp)
    ]))
    // combine the responses from the arrays above and pass the response along
    // for further processing
    .then(normalizeResponseObject)
    .catch(err => log.error(err))
    .then(resolve)
  )

export default navigation
