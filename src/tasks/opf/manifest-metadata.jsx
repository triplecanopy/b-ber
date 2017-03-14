
/**
 * Scans directory contents and reads YAML files to create the `manifest` and
 * `metadata` elements in the `content.opf`
 * @module manifestAndMetadata
 */

import renderLayouts from 'layouts'
import path from 'path'
import File from 'vinyl'
import rrdir from 'recursive-readdir'
import YAML from 'yamljs'
import { log } from '../../log'
import * as tmpl from '../../templates'
import { cjoin, src, dist, version } from '../../utils'
import { pathInfoFromFiles } from './helpers'

let bookmeta, input, output, ver
const initialize = () => {
  input = src()
  output = dist()
  ver = version()
  return Promise.resolve()
}

const loadMetadataFromYAML = () =>
  new Promise(resolve/* , reject */ =>
    YAML.load(path.join(input, 'metadata.yml'), (resp) => {
      bookmeta = resp
      resolve()
    })
  )


/**
 * Retrieve lists of files to include in the `content.opf`
 * @return {Promise<Object<Array>|Error>} [description]
 */
const createManifestObjectFromAssets = () =>
  new Promise((resolve, reject) =>
    rrdir(`${output}/OPS`, (err, filearr) => {
      if (err) { reject(err) }
      // TODO: better testing here, make sure we're not including symlinks, for example
      const files = filearr.filter(_ => path.basename(_).charAt(0) !== '.')
      const fileObjects = pathInfoFromFiles(files, output) // `pathInfoFromFiles` is creating objects from file names
      resolve(fileObjects)
    })
  )

const createManifestAndMetadataFromTemplates = files =>
  new Promise((resolve /* , reject */) => {
    // TODO: this will already be loaded in bber object
    const strings = { manifest: [], bookmeta: [] }
    strings.bookmeta = bookmeta.map(_ => tmpl.opf.metatag(_)).filter(Boolean)

    // Add exceptions here as needed
    strings.bookmeta = [
      ...strings.bookmeta,
      '<meta property="ibooks:specified-fonts">true</meta>',
      `<meta property="dcterms:modified">${new Date().toISOString().replace(/\.\d{3}Z$/, 'Z')}</meta>`, // eslint-disable-line max-len
      `<meta name="generator" content="b-ber@${ver}" />`
    ]

    files.forEach((file, idx) => {
      strings.manifest.push(tmpl.opf.item(file))
      if (idx === files.length - 1) { resolve(strings) }
    })
  })


const createManifestAndMetadataXML = strings =>
  new Promise(resolve/* , reject */ =>
    resolve(
      renderLayouts(new File({
        path: './.tmp',
        layout: 'opfPackage',
        contents: new Buffer([
          renderLayouts(new File({
            path: './.tmp',
            layout: 'opfMetadata',
            contents: new Buffer(strings.bookmeta.join(''))
          }), tmpl.opf).contents.toString(),
          renderLayouts(new File({
            path: './.tmp',
            layout: 'opfManifest',
            contents: new Buffer(cjoin(strings.manifest))
          }), tmpl.opf).contents.toString()
        ].join('\n'))
      }), tmpl.opf)
      .contents
      .toString()
    )
  )

const manifestAndMetadata = () =>
  new Promise(resolve/* , reject */ =>

    // make sure that variables are loaded
    initialize()

    // get the book metadata from yaml file
    .then(loadMetadataFromYAML)

    // get lists of files to include in the `content.opf`
    .then(createManifestObjectFromAssets)

    // create strings of XML entries for the `content.opf`
    .then(createManifestAndMetadataFromTemplates)

    // create the manifest and metadata from templating strings.manifest and
    // strings.metadata
    .then(createManifestAndMetadataXML)

    // handle err
    .catch(err => log.error(err))

    // next
    .then(resolve)

  )

export default manifestAndMetadata
