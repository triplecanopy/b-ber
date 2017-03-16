
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

/**
 * Create the root `package` element and inject metadata, manifest, and
 * navigation data
 * @param  {Object} manifestAndMetadataXML Manifest and metadata XML
 * @param  {Object} navigationXML          Navigation XML
 * @return {Promise<Object>}
 */
const createOpfPackageString = ([manifestAndMetadataXML, navigationXML]) =>
  new Promise((resolve, reject) => {
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

/**
 * Write the `content.opf` to the output directory
 * @param  {String} contents The `content.opf` string
 * @return {Promise<Object>}
 */
const writeOpfToDisk = contents =>
  new Promise((resolve, reject) => {
    const opsPath = path.join(dist(), 'OPS', 'content.opf')
    fs.writeFile(opsPath, contents, (err) => {
      if (err) { throw err }
      resolve()
    })
  })

/**
 * Initialize `content.opf` creation
 * @return {Promise<Object>}
 */
const opf = () =>
  new Promise(resolve/* , reject */ =>
    Promise.all([
      manifestAndMetadata(),
      navigation()
    ])
    .then(createOpfPackageString)
    .then(writeOpfToDisk)
    .catch(err => log.error(err))
    .then(resolve)
  )

export default opf
