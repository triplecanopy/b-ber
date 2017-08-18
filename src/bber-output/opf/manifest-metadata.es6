/* eslint-disable class-methods-use-this */

/**
 * Scans directory contents and reads YAML files to create the `manifest` and
 * `metadata` elements in the `content.opf`
 * @see  {@link module:manifestAndMetadata#ManifestAndMetadata}
 * @module manifestAndMetadata
 */

import Promise from 'zousan'
import renderLayouts from 'layouts'
import path from 'path'
import File from 'vinyl'
import rrdir from 'recursive-readdir'
import { log } from 'bber-plugins'
import * as tmpl from 'bber-templates'
import { cjoin, src, dist, version, metadata } from 'bber-utils'
import { pathInfoFromFiles } from './helpers'
import store from 'bber-lib/store'

/**
 * @alias module:manifestAndMetadata#ManifestAndMetadata
 */
class ManifestAndMetadata {
  // https://github.com/eslint/eslint/issues/7911
  get src() {
    return src()
  }
  get dist() {
    return dist()
  }
  get version() {
    return version()
  }

  /**
   * @constructor
   * @return {Object}
   */
  constructor() {
    this.bookmeta = null
    this.createManifestAndMetadataXML = ManifestAndMetadata.createManifestAndMetadataXML
  }

  /**
   * [loadMetadata description]
   * @return {Object<Promise>}
   */
  loadMetadata() {
    return new Promise((resolve) => {
      this.bookmeta = metadata()
      resolve()
    })
  }

  /**
   * Retrieve lists of files to include in the `content.opf`
   * @return {Promise<Object<Array>|Error>}
   */
  createManifestObjectFromAssets() {
    return new Promise(resolve =>
      rrdir(`${this.dist}/OPS`, (err, filearr) => {
        if (err) { throw err }
        // TODO: better testing here, make sure we're not including symlinks, for example
        const files = [...store.remoteAssets, ...filearr.filter(_ => path.basename(_).charAt(0) !== '.')]
        const fileObjects = pathInfoFromFiles(files, this.dist) // `pathInfoFromFiles` is creating objects from file names
        resolve(fileObjects)
      })
    )
  }

  /**
   * [createManifestAndMetadataFromTemplates description]
   * @param  {Array} files [description]
   * @return {Promise<Object|Error>}
   */
  createManifestAndMetadataFromTemplates(files) {
    return new Promise((resolve) => {
      // TODO: this will already be loaded in bber object
      const strings = { manifest: [], bookmeta: [] }
      strings.bookmeta = this.bookmeta.map(_ => tmpl.opf.metatag(_)).filter(Boolean)

      // Add exceptions here as needed
      strings.bookmeta = [
        ...strings.bookmeta,
        '<meta property="ibooks:specified-fonts">false</meta>',
        `<meta property="dcterms:modified">${new Date().toISOString().replace(/\.\d{3}Z$/, 'Z')}</meta>`, // eslint-disable-line max-len
        `<meta name="generator" content="b-ber@${this.version}" />`,
      ]

      files.forEach((file, idx) => {
        strings.manifest.push(tmpl.opf.manifestItem(file))
        if (idx === files.length - 1) { resolve(strings) }
      })
    })
  }

  /**
   * [createManifestAndMetadataXML description]
   * @param  {Object} resp [description]
   * @return {Object<Promise|Error>}
   */
  static createManifestAndMetadataXML(resp) {
    log.info('bber-output/opf: Building [manifest]')
    log.info('bber-output/opf: Building [metadata]')
    return new Promise((resolve) => {
      const _metadata = renderLayouts(new File({
        path: './.tmp',
        layout: 'opfMetadata',
        contents: new Buffer(resp.bookmeta.join('')),
      }), tmpl.opf).contents.toString()

      const manifest = renderLayouts(new File({
        path: './.tmp',
        layout: 'opfManifest',
        contents: new Buffer(cjoin(resp.manifest)),
      }), tmpl.opf).contents.toString()

      resolve({ metadata: _metadata, manifest })
    })
  }

  /**
   * [init description]
   * @return {Object<Promise|Error>}
   */
  init() {
    return new Promise(resolve =>
      // get the book metadata from store or yaml file
      this.loadMetadata()

      // get lists of files to include in the `content.opf`
      .then(() => this.createManifestObjectFromAssets())

      // create strings of XML entries for the `content.opf`
      .then(resp => this.createManifestAndMetadataFromTemplates(resp))

      // create the manifest and metadata from templating strings.manifest and
      // strings.metadata
      .then(resp => this.createManifestAndMetadataXML(resp))

      // handle err
      .catch(err => log.error(err))

      // next
      .then(resolve)
    )
  }
}


export default ManifestAndMetadata
