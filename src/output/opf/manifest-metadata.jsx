
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
import { log } from 'plugins'
import * as tmpl from 'templates'
import { cjoin, src, dist, version } from 'utils'
import { pathInfoFromFiles } from './helpers'


class ManifestAndMetadata {
  // https://github.com/eslint/eslint/issues/7911
  get src() { // eslint-disable-line class-methods-use-this
    return src()
  }
  get dist() { // eslint-disable-line class-methods-use-this
    return dist()
  }
  get version() { // eslint-disable-line class-methods-use-this
    return version()
  }

  constructor() {
    this.bookmeta = null
    this.createManifestAndMetadataXML = ManifestAndMetadata.createManifestAndMetadataXML
  }

  loadMetadataFromYAML() {
    return new Promise(resolve/* , reject */ =>
      YAML.load(path.join(this.src, 'metadata.yml'), (resp) => {
        this.bookmeta = resp
        resolve()
      })
    )
  }

  /**
   * Retrieve lists of files to include in the `content.opf`
   * @return {Promise<Object<Array>|Error>} [description]
   */
  createManifestObjectFromAssets() {
    return new Promise(resolve/* , reject */ =>
      rrdir(`${this.dist}/OPS`, (err, filearr) => {
        if (err) { throw err }
        // TODO: better testing here, make sure we're not including symlinks, for example
        const files = filearr.filter(_ => path.basename(_).charAt(0) !== '.')
        const fileObjects = pathInfoFromFiles(files, this.dist) // `pathInfoFromFiles` is creating objects from file names
        resolve(fileObjects)
      })
    )
  }

  createManifestAndMetadataFromTemplates(files) {
    return new Promise((resolve /* , reject */) => {
      // TODO: this will already be loaded in bber object
      const strings = { manifest: [], bookmeta: [] }
      strings.bookmeta = this.bookmeta.map(_ => tmpl.opf.metatag(_)).filter(Boolean)

      // Add exceptions here as needed
      strings.bookmeta = [
        ...strings.bookmeta,
        '<meta property="ibooks:specified-fonts">true</meta>',
        `<meta property="dcterms:modified">${new Date().toISOString().replace(/\.\d{3}Z$/, 'Z')}</meta>`, // eslint-disable-line max-len
        `<meta name="generator" content="b-ber@${version}" />`
      ]

      files.forEach((file, idx) => {
        strings.manifest.push(tmpl.opf.manifestItem(file))
        if (idx === files.length - 1) { resolve(strings) }
      })
    })
  }

  static createManifestAndMetadataXML(resp) {
    return new Promise((resolve/* , reject */) => {
      const metadata = renderLayouts(new File({
        path: './.tmp',
        layout: 'opfMetadata',
        contents: new Buffer(resp.bookmeta.join(''))
      }), tmpl.opf).contents.toString()

      const manifest = renderLayouts(new File({
        path: './.tmp',
        layout: 'opfManifest',
        contents: new Buffer(cjoin(resp.manifest))
      }), tmpl.opf).contents.toString()

      resolve({ metadata, manifest })
    })
  }

  init() {
    return new Promise(resolve/* , reject */ =>
      // get the book metadata from yaml file
      this.loadMetadataFromYAML()

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


// export default new ManifestAndMetadata()


// const manifestAndMetadata = () => Promise.resolve()
export default ManifestAndMetadata
