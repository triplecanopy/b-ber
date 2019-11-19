/* eslint-disable class-methods-use-this */

// Scans directory contents and reads YAML files to create the `manifest` and
// `metadata` elements in the `content.opf`

import path from 'path'
import renderLayouts from 'layouts'
import File from 'vinyl'
import rrdir from 'recursive-readdir'
import has from 'lodash/has'
import log from '@canopycanopycanopy/b-ber-logger'
import Metadata from '@canopycanopycanopy/b-ber-templates/Opf/Metadata'
import Manifest from '@canopycanopycanopy/b-ber-templates/Opf/Manifest'
import state from '@canopycanopycanopy/b-ber-lib/State'
import { pathInfoFromFiles } from './helpers'

class ManifestAndMetadata {
  constructor() {
    this.bookmeta = null
  }

  async loadMetadata() {
    this.bookmeta = state.metadata.json()
  }

  // Retrieve lists of files to include in the `content.opf`
  async createManifestObjectFromAssets() {
    let files = await rrdir(state.dist.ops())

    // TODO: better testing here, make sure we're not including symlinks, for example
    // @issue: https://github.com/triplecanopy/b-ber/issues/228
    files = [
      ...state.remoteAssets,
      ...files.filter(file => path.basename(file).charAt(0) !== '.'),
    ]
    const fileObjects = pathInfoFromFiles(files, state.distDir)
    return fileObjects
  }

  createManifestAndMetadataFromTemplates(files) {
    const manifest = files.map(file => Manifest.item(file))

    const specifiedFonts =
      has(state.config, 'ibooks_specified_fonts') &&
      state.config.ibooks_specified_fonts === true
    const modified = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z')
    const generator = `b-ber@${state.version}`

    // Add exceptions here as needed
    const bookmeta = [
      ...this.bookmeta.map(value => Metadata.meta(value)).filter(Boolean),
      `<meta property="ibooks:specified-fonts">${specifiedFonts}</meta>`,
      `<meta property="dcterms:modified">${modified}</meta>`,
      `<meta name="generator" content="${generator}" />`,
    ]

    return { manifest, bookmeta }
  }

  createManifestAndMetadataXML(resp) {
    log.info('opf build [metadata]')

    const metadata = renderLayouts(
      new File({
        path: '.tmp',
        layout: 'body',
        contents: Buffer.from(resp.bookmeta.join('')),
      }),
      { body: Metadata.body() }
    ).contents.toString()

    log.info('opf build [manifest]')

    const manifest = renderLayouts(
      new File({
        path: '.tmp',
        layout: 'body',
        contents: Buffer.from(resp.manifest.filter(Boolean).join('')),
      }),
      { body: Manifest.body() }
    ).contents.toString()

    return { metadata, manifest }
  }

  init() {
    // get the book metadata from state or yaml file
    return (
      this.loadMetadata()

        // get lists of files to include in the `content.opf`
        .then(() => this.createManifestObjectFromAssets())

        // create strings of XML entries for the `content.opf`
        .then(resp => this.createManifestAndMetadataFromTemplates(resp))

        // create the manifest and metadata from templating strings.manifest and
        // strings.metadata
        .then(resp => this.createManifestAndMetadataXML(resp))
        .catch(log.error)
    )
  }
}

export default ManifestAndMetadata
