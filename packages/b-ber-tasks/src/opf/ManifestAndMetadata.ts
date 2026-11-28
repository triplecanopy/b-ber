/* eslint-disable class-methods-use-this */

// Scans directory contents and reads YAML files to create the `manifest` and
// `metadata` elements in the `content.opf`

import path from 'node:path'
import type { BuildContext, MetadataEntry } from '@canopycanopycanopy/b-ber-lib'
import log from '@canopycanopycanopy/b-ber-logger'
import Manifest from '@canopycanopycanopy/b-ber-templates/Opf/Manifest'
import Metadata from '@canopycanopycanopy/b-ber-templates/Opf/Metadata'
import renderLayouts from 'layouts'
import has from 'lodash/has'
import rrdir from 'recursive-readdir'
import File from 'vinyl'
import { dist, distDir, libVersion } from '../context'
import { pathInfoFromFiles } from './helpers'

// One per `content.opf` written: it holds the build's context and the
// metadata it reads, so it is created for each call, never shared
class ManifestAndMetadata {
  ctx: BuildContext

  // URLs of the media the book embeds from elsewhere, listed in the manifest
  remoteAssets: string[]

  bookmeta: MetadataEntry[]

  constructor(ctx: BuildContext, { remoteAssets }: { remoteAssets: string[] }) {
    this.ctx = ctx
    this.remoteAssets = remoteAssets
    this.bookmeta = []
  }

  async loadMetadata() {
    this.bookmeta = this.ctx.project.metadata.json()
  }

  // Retrieve lists of files to include in the `content.opf`
  async createManifestObjectFromAssets() {
    let files = await rrdir(dist(this.ctx).ops())

    // TODO: better testing here, make sure we're not including symlinks, for example
    // @issue: https://github.com/triplecanopy/b-ber/issues/228
    files = [
      ...this.remoteAssets,
      ...files.filter((file: string) => path.basename(file).charAt(0) !== '.'),
    ]
    const fileObjects = pathInfoFromFiles(files, distDir(this.ctx))
    return fileObjects
  }

  createManifestAndMetadataFromTemplates(
    files: ReturnType<typeof pathInfoFromFiles>
  ) {
    const manifest = files.map((file) => Manifest.item(file))

    const { config } = this.ctx
    const specifiedFonts =
      has(config, 'ibooks_specified_fonts') &&
      config.ibooks_specified_fonts === true

    const modified = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z')
    const generator = `b-ber@${libVersion()}`

    // Add exceptions here as needed
    const bookmeta = [
      ...this.bookmeta.map((value) => Metadata.meta(value)).filter(Boolean),
      `<meta property="ibooks:specified-fonts">${specifiedFonts}</meta>`,
      `<meta property="dcterms:modified">${modified}</meta>`,
      `<meta name="generator" content="${generator}" />`,
    ]

    return { manifest, bookmeta }
  }

  createManifestAndMetadataXML(resp: {
    manifest: string[]
    bookmeta: string[]
  }) {
    log.info('opf build [metadata]')

    const metadata =
      renderLayouts(
        new File({
          path: '.tmp',
          layout: 'body',
          contents: Buffer.from(resp.bookmeta.join('')),
        }),
        { body: Metadata.body() }
      ).contents?.toString() ?? ''

    log.info('opf build [manifest]')

    const manifest =
      renderLayouts(
        new File({
          path: '.tmp',
          layout: 'body',
          contents: Buffer.from(resp.manifest.filter(Boolean).join('')),
        }),
        { body: Manifest.body() }
      ).contents?.toString() ?? ''

    return { metadata, manifest }
  }

  init() {
    // get the book metadata the project read from metadata.yml
    return (
      this.loadMetadata()

        // get lists of files to include in the `content.opf`
        .then(() => this.createManifestObjectFromAssets())

        // create strings of XML entries for the `content.opf`
        .then((resp) => this.createManifestAndMetadataFromTemplates(resp))

        // create the manifest and metadata from templating strings.manifest and
        // strings.metadata
        .then((resp) => this.createManifestAndMetadataXML(resp))
        .catch((err) => {
          throw log.error(err)
        })
    )
  }
}

export default ManifestAndMetadata
