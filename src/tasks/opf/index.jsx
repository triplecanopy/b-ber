
/**
 * Generates metadata, manifest, guide, and spine XML and writes to to
 * `content.opf`. Calls {@link module:manifestAndMetadata} and {@link module:navigation}
 * @module opf
 */

import path from 'path'
import fs from 'fs-extra'
import renderLayouts from 'layouts'
import File from 'vinyl'
import manifestAndMetadata from './manifest-metadata'
import navigation from './navigation'
import { opfPackage } from '../../templates/opf'
import { dist } from '../../utils'
import { log } from '../../log'

class Opf {

  constructor() {
    this.createOpfPackageString = Opf.createOpfPackageString
    this.writeOpfToDisk = Opf.writeOpfToDisk
  }

  /**
   * Create the root `package` element and inject metadata, manifest, and
   * navigation data
   * @param  {Object} manifestAndMetadataXML Manifest and metadata XML
   * @param  {Object} navigationXML          Navigation XML
   * @return {Promise<Object>}
   */
  static createOpfPackageString([manifestAndMetadataXML, navigationXML]) {
    return new Promise((resolve, reject) => {
      const { metadata, manifest } = manifestAndMetadataXML
      const { spine, guide } = navigationXML.strings
      const opfString = renderLayouts(new File({
        path: './.tmp',
        layout: 'opfPackage',
        contents: new Buffer([metadata, manifest, spine, guide].join('\n'))
      }), { opfPackage })
      .contents
      .toString()
      resolve(opfString)
    })
  }

  /**
   * Write the `content.opf` to the output directory
   * @param  {String} contents The `content.opf` string
   * @return {Promise<Object>}
   */
  static writeOpfToDisk(contents) {
    return new Promise((resolve, reject) => {
      const opsPath = path.join(dist(), 'OPS', 'content.opf')
      fs.writeFile(opsPath, contents, (err) => {
        if (err) { throw err }
        resolve(contents)
      })
    })
  }

  /**
   * Initialize `content.opf` creation
   * @return {Promise<Object>}
   */
  init() {
    return new Promise(resolve/* , reject */ =>
      Promise.all([
        manifestAndMetadata(),
        navigation()
      ])
      .then(this.createOpfPackageString)
      .then(this.writeOpfToDisk)
      .catch(err => log.error(err))
      .then(resolve)
    )
  }
}

const opf = process.env.NODE_ENV === 'test' ? Opf : new Opf().init()
export default opf
