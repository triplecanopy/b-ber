
// /**
//  * Scans directory contents and reads YAML files to create the `spine` and
//  * `guide` elements in the `content.opf`. Writes essential navigation
//  * documents (`toc.ncx`, `toc.xhtml`) to the output directory
//  * @module navigation
//  */

// // vendor
// import renderLayouts from 'layouts'
// import path from 'path'
// import fs from 'fs-extra'
// import File from 'vinyl'
// import rrdir from 'recursive-readdir'
// import YAML from 'yamljs'
// import { findIndex, difference, uniq } from 'lodash'

// // utility
// import Props from '../../modules/props'
// import { log, logg } from '../../log'
// import { src, dist, build, promiseAll } from '../../utils'

// // templates
// import { tocTmpl, tocItem } from '../../templates/toc-xhtml'
// import { ncxTmpl, navPoint } from '../../templates/toc-ncx'
// import { opfGuide, opfSpine, guideItems, spineItems } from '../../templates/opf'

// // helpers
// import { pathInfoFromFiles, flattenYamlEntries, removeNestedArrayItem,
//   createPagesMetaYaml, nestedLinearContent, buildNavigationObjects } from './helpers'

// const navdocs = ['toc.ncx', 'toc.xhtml']
// let input, output, buildType

// /**
//  * Remove the `toc.xhtml` and `toc.ncx` from the output directory
//  * @return {Promise<Object|Error>}
//  */
// const unlinkExistingNavDocuments = () =>
//   new Promise((resolve, reject) =>
//     navdocs.forEach((file, idx) =>
//       fs.remove(
//         path.join(output, 'OPS', file), (err1) => {
//           if (err1) { reject(err1) }
//           return fs.writeFile(
//             path.join(output, 'OPS', file), '', (err2) => {
//               if (err2) { reject(err2) }
//               if (idx === navdocs.length - 1) { resolve() }
//             }
//           )
//         }
//       )
//     )
//   )

// /**
//  * Ensure build variables are set before execution
//  * @return {Promise<Object|Error>}
//  */
// const initialize = () => {
//   input = src()
//   output = dist()
//   buildType = build()
//   return Promise.resolve()
// }

// /**
//  * Retrieve a list of all XHTML files in the output directory
//  * @return {Promise<Object|Error>}
//  */
// const getAllXhtmlFiles = () =>
//   new Promise((resolve, reject) =>
//     rrdir(`${output}/OPS`, (err, filearr) => {
//       if (err) { reject(err) }
//       // TODO: better testing here, make sure we're not including symlinks, for example
//       const fileObjects = pathInfoFromFiles(filearr, output)
//       // only get html files
//       const xhtmlFileObjects = fileObjects.filter(_ => Props.isHTML(_))
//       // prepare for diffing
//       const filesFromSystem = uniq(xhtmlFileObjects.map(_ => path.basename(_.name, _.extension)))
//       resolve({ filesFromSystem, fileObjects })
//     })
//   )

// const addMissingEntriesToNonLinearSection = (arr, missingEntries) => {
//   let nonLinearIndex = findIndex(arr, 'nonLinear')
//   if (nonLinearIndex < 0) { nonLinearIndex = (arr.push({ nonLinear: [] })) - 1 }
//   missingEntries.forEach(_ => arr[nonLinearIndex].nonLinear.push(_))
//   return arr
// }

// const readYamlConfigFiles = resp =>
//   new Promise((resolve/* , reject */) => {
//     const yamlpath = path.join(input, `${buildType}.yml`)
//     let filesFromYaml = []
//     try {
//       if (fs.statSync(yamlpath)) {
//         const entries = YAML.load(yamlpath)
//         const flattenedEntries = uniq(flattenYamlEntries(entries).map(_ => path.basename(_, '.xhtml')))
//         // we need both `flattenedEntries` for comparison, and `entries` which
//         // contains page hierarchy
//         filesFromYaml = { entries, flattenedEntries }
//       }
//     } catch (err) {
//       log.warn(`\`${buildType}.yml\` not found. Creating default file.`)
//       createPagesMetaYaml(input, buildType)
//     }
//     resolve({ filesFromYaml, ...resp })
//   })

// /**
//  * Resolve discrepancies between files that exist in the output directory and
//  * those that are listed in the YAML manifest
//  * @param  {Array} filesFromSystem XHTML files in the output directory
//  * @param  {Array} filesFromYaml   Entries in the YAML manifest
//  * @return {Promise<Object<Array>|Error>}
//  */
// const compareXhtmlWithYaml = args =>
//   new Promise((resolve, reject) => {
//     const { filesFromSystem, fileObjects } = args[0]
//     const { filesFromYaml } = args[1]
//     const { entries, flattenedEntries } = filesFromYaml
//     const pages = Array.prototype.slice.call(entries, 0)
//     const flow = flattenedEntries // one-dimensional flow of the book used for the spine

//     // check that all entries are accounted for
//     const pagediff = difference(flattenedEntries, filesFromSystem) // missing files
//     const filediff = difference(filesFromSystem, flattenedEntries) // missing entries

//     if (pagediff.length || filediff.length) {
//       // there are discrepencies between the files on the system and files
//       // declared in the `buildType`.yml file
//       if (pagediff.length) {
//         // there are extra entries in the YAML (i.e., missing XHTML pages)
//         log.warn(`XHTML pages for ${buildType}.yml do not exist:`)
//         log.warn(pagediff.map(_ => `${_}.xhtml`))
//         log.warn(`Removing redundant entries in ${buildType}.yml`)

//         // cycle through the diff to remove redundant entries. called with
//         // lodash#remove, which mutates, so no need to re-assign
//         pagediff.forEach((_) => {
//           removeNestedArrayItem(pages, `${_}.xhtml`)

//           const refIndex = flow.indexOf(_)
//           if (refIndex > -1) { flow.splice(refIndex, 1) }
//         })

//       }
//       if (filediff.length) {
//         // there are missing entries in the YAML (i.e., extra XHTML pages),
//         // but we don't know where to interleave them. we add them to the
//         // manifest so that the ebook validates, but keep them hidden from the
//         // flow of the book
//         log.warn(`Missing entries in ${buildType}.yml files:`)
//         log.warn(filediff.map(_ => `${_}.xhtml`))
//         log.warn(`Adding missing entries as \`non-linear\` content to ${buildType}.yml`)

//         // prefer not to mutate `pages`, but may as well keep consistent behaviour as above ...
//         addMissingEntriesToNonLinearSection(pages, filediff)
//       }
//     }

//     // finally, remove all non-linear content from `flow` since we don't want
//     // it showing up in the spine. this is _not_ the same as `linear="no"`,
//     // meaning that any hyperlinks in the document to these pages will
//     // invalidate the ebook.
//     const nonLinearIndex = findIndex(pages, 'nonLinear')
//     if (nonLinearIndex > -1) {
//       pages[nonLinearIndex].nonLinear.forEach((_) => {
//         const ref = _.replace(/\.xhtml$/, '')
//         const refIndex = flow.indexOf(ref)
//         if (refIndex > -1) { flow.splice(refIndex, 1) }
//       })
//     }

//     resolve({ pages, flow, fileObjects, filesFromSystem, filesFromYaml })
//   })

// /**
//  * Update the YAML manifest with missing entries
//  * @param  {Array} options.pages Nested array of XHTML file names
//  * @param  {Array} options.flow  One-dimensional array of XHTML file names
//  * @return {Promise<Object<Array>|Error>}
//  */
// const updateConfigFileWithValidAssetPaths = ({ pages, flow, ...args }) =>
//   new Promise((resolve, reject) => {
//     const yamlpath = path.join(input, `${buildType}.yml`)
//     const content = YAML.stringify(pages, Infinity, 2)
//     fs.writeFile(yamlpath, content, (err) => {
//       if (err) { reject(err) }
//       resolve({ pages, flow, ...args })
//     })
//   })

// const createTocStringsFromTemplate = ({ pages, ...args }) =>
//   new Promise((resolve/* , reject */) => {
//     // TODO: this should use the `fileObjects` object from `args` to build the
//     // template
//     const strings = {}
//     const linearContent = nestedLinearContent(pages)
//     const tocObjects = buildNavigationObjects(linearContent, output)
//     const tocHTML = tocItem(tocObjects)

//     strings.toc = renderLayouts(new File({
//       path: './.tmp',
//       layout: 'tocTmpl',
//       contents: new Buffer(tocHTML)
//     }), { tocTmpl })
//     .contents
//     .toString()

//     resolve({ pages, strings, ...args })
//   })

// const createNcxStringsFromTemplate = ({ pages, ...args }) =>
//   new Promise((resolve, reject) => {
//     // TODO: this should use the `fileObjects` object from `args` to build the
//     // template
//     const strings = {}
//     const linearContent = nestedLinearContent(pages)
//     const ncxObjects = buildNavigationObjects(linearContent, output)
//     const ncxXML = navPoint(ncxObjects)

//     strings.ncx = renderLayouts(new File({
//       path: './.tmp',
//       layout: 'ncxTmpl',
//       contents: new Buffer(ncxXML)
//     }), { ncxTmpl })
//     .contents
//     .toString()

//     resolve({ pages, strings, ...args })
//   })

// const createGuideStringsFromTemplate = ({ flow, fileObjects, ...args }) =>
//   new Promise((resolve, reject) => {
//     const strings = {}
//     // TODO: `fileObjects` should be sorted to match `flow`
//     const guideXML = guideItems(fileObjects)

//     strings.guide = renderLayouts(new File({
//       path: './.tmp',
//       layout: 'opfGuide',
//       contents: new Buffer(guideXML)
//     }), { opfGuide })
//     .contents
//     .toString()

//     resolve({ strings, flow, fileObjects, ...args })
//   })

// const createSpineStringsFromTemplate = ({ flow, fileObjects, ...args }) =>
//   new Promise((resolve, reject) => {
//     const strings = {}
//     // TODO: `fileObjects` should be sorted to match `flow`. also, non-linear
//     // content needs to be fed into the templating engine
//     const spineXML = spineItems(fileObjects)

//     strings.spine = renderLayouts(new File({
//       path: './.tmp',
//       layout: 'opfSpine',
//       contents: new Buffer(spineXML)
//     }), { opfSpine })
//     .contents
//     .toString()

//     resolve({ strings, flow, fileObjects, ...args })
//   })

// /**
//  * Returns a new object from an array of return values from `Promise.all`.
//  * Deep merges a single property passed in as `property`. Uses `Object.assign`
//  * @param  {Array<Object>} args  The objects to merge
//  * @param  {String} property     The properties of `args` to merge
//  * @return {Object}              Deep merged object
//  */
// const deepMergePromiseArrayValues = (args, property) => {
//   const argsArray = args.map(_ => _)
//   const propsArray = args.map(_ => _[property])
//   const props = Object.assign({}, ...propsArray)
//   return Object.assign({}, ...argsArray, { [property]: props })
// }

// const writeTocXhtmlFile = args =>
//   new Promise((resolve, reject) => {
//     const result = deepMergePromiseArrayValues(args, 'strings')
//     const { toc } = result.strings
//     const filepath = path.join(output, 'OPS', 'toc.xhtml')
//     fs.writeFile(filepath, toc, (err) => {
//       if (err) { throw err }
//       resolve(result)
//     })
//   })

// const writeTocNcxFile = args =>
//   new Promise((resolve, reject) => {
//     const result = deepMergePromiseArrayValues(args, 'strings')
//     const { ncx } = result.strings
//     const filepath = path.join(output, 'OPS', 'toc.ncx')
//     fs.writeFile(filepath, ncx, (err) => {
//       if (err) { throw err }
//       resolve(result)
//     })
//   })

// const normalizeResponseObject = args =>
//   new Promise((resolve, reject) => {
//     const normalizedResponse = deepMergePromiseArrayValues(args, 'strings')
//     resolve(normalizedResponse)
//   })

// /**
//  * Create string representations of navigation data to inject into the
//  * `content.opf`
//  * @param  {Object} args
//  * @return {String}
//  */
// // const createNavigationXML = ({ strings }) =>
// //   new Promise((resolve, reject) => {
// //     const { spine, guide } = strings
// //     const navigationXML = `${spine}\n${guide}`
// //     resolve(navigationXML)
// //   })

// /**
//  * Initialize promise chain to build ebook navigation structure
//  * @return {Promise<Object|Error>}
//  */
// const navigation = () =>
//   new Promise(resolve/* , reject */ =>
//     initialize()
//     .then(unlinkExistingNavDocuments)
//     .then(resp => promiseAll([
//       getAllXhtmlFiles(resp),
//       readYamlConfigFiles(resp)
//     ]))
//     .then(compareXhtmlWithYaml)
//     .then(updateConfigFileWithValidAssetPaths)
//     .then(resp => promiseAll([
//       createTocStringsFromTemplate(resp),
//       createNcxStringsFromTemplate(resp),
//       createGuideStringsFromTemplate(resp),
//       createSpineStringsFromTemplate(resp)
//     ]))
//     .then(resp => promiseAll([
//       // the two following methods both merge the results from `Promise.all`
//       // and return identical new objects containing all navigation
//       // information to the next method in the chain
//       writeTocXhtmlFile(resp),
//       writeTocNcxFile(resp)
//     ]))
//     // merge the values from the arrays returned above and pass the response
//     // along to write the `content.opf`
//     .then(normalizeResponseObject)
//     // .then(createNavigationXML)
//     .catch(err => log.error(err))
//     .then(resolve)
//   )

const navigation = () => Promise.resolve()

export default navigation
