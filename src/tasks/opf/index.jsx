
/**
 * @module opf
 */

/*

  TODO: creating the OPF should be done in multiple stages:
    - remove existing nav docs
    - create manifest and metadata
    - create nav docs and XML (spine, guide, ncx, toc.xhtml)
    - concatenate everything
    - write it to disk

 */

import path from 'path'
import fs from 'fs-extra'

import manifestAndMetadata from './manifest-metadata'
import navigation from './navigation'
import { log } from '../../log'

// `navigationXML` should only be data that pertains to the `content.opf`. the
// `navigation` module should take care of writing the nav documents
const concatenateData = ([manifestAndMetadataXML, navigationXML]) =>
  new Promise((resolve, reject) => {
    resolve()
  })

const renderStringsAsXML = () =>
  new Promise((resolve, reject) => {
    resolve()
  })

const writeOpfToDisk = () =>
  new Promise((resolve, reject) => {
    resolve()
  })

const opf = () =>
  new Promise(resolve/* , reject */ =>
    Promise.all([
      manifestAndMetadata(),
      navigation()
    ])
    .then(resp => concatenateData(resp))
    .then(renderStringsAsXML)
    .then(writeOpfToDisk)

    // err
    .catch(err => log.error(err))

    // next
    .then(resolve)

  )

export default opf
