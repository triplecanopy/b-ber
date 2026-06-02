// Generates metadata, manifest, guide, and spine XML and writes to to `content.opf`

import fs from 'fs-extra'
import renderLayouts from 'layouts' // eslint-disable-line import/no-unresolved
import File from 'vinyl' // eslint-disable-line import/no-unresolved
import state from '@canopycanopycanopy/b-ber-lib/State'
import log from '@canopycanopycanopy/b-ber-logger'
import Pkg from '@canopycanopycanopy/b-ber-templates/Opf/Pkg'
import ManifestAndMetadata from './ManifestAndMetadata'
import Navigation from './Navigation'

class Opf {
  static createOpf() {
    const manifestAndMetadata = new ManifestAndMetadata()

    return Promise.all([manifestAndMetadata.init(), Navigation.init()])
      .then(Opf.createOpfPackageString)
      .then(Opf.writeOPF)
      .catch(log.error)
  }

  static writeOPF(contents: string) {
    const opsPath = state.dist.ops('content.opf')
    log.info(`opf emit content.opf [${opsPath}]`)

    return fs.writeFile(opsPath, contents)
  }

  // Create the root `package` element and inject metadata, manifest, and navigation data
  static createOpfPackageString([manifestAndMetadataXML, navigationXML]: [any, any]) {
    log.info('opf build [package]')

    const { metadata, manifest } = manifestAndMetadataXML
    const { guide, spine } = navigationXML

    const opfString = renderLayouts(
      new File({
        path: '.tmp',
        layout: 'body',
        contents: Buffer.from(`
                        ${metadata}
                        ${manifest}
                        ${spine}
                        ${guide}
                `),
      }),
      { body: Pkg.body() }
    ).contents?.toString() ?? ''

    return opfString
  }
}

export default Opf
