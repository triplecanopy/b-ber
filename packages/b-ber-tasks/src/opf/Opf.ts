// Generates metadata, manifest, guide, and spine XML and writes to to `content.opf`

import state from '@canopycanopycanopy/b-ber-lib/State'
import log from '@canopycanopycanopy/b-ber-logger'
import Pkg from '@canopycanopycanopy/b-ber-templates/Opf/Pkg'
import fs from 'fs-extra'
import renderLayouts from 'layouts' // eslint-disable-line import/no-unresolved
import File from 'vinyl' // eslint-disable-line import/no-unresolved
import ManifestAndMetadata from './ManifestAndMetadata'
import Navigation from './Navigation'

// What the `init`s below resolve to when they succeed. Each resolves to
// undefined instead when it fails and `log.error` does not exit, which it only
// does not at `--log-level=0`. Spelled out rather than derived from the
// `init`s: their types come through the `layouts` stub, which tsdown's
// declaration build does not see, so derived types are `any` in dist/index.d.ts.
// `createOpf` passes the `init`s' results here, which checks the two agree
interface ManifestAndMetadataXML {
  metadata: string
  manifest: string
}
interface NavigationXML {
  spine: string
  guide: string
}

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
  // Either part is undefined only after a failure `log.error` did not exit
  // for, and destructuring it throws, as it always has
  static createOpfPackageString([manifestAndMetadataXML, navigationXML]: [
    ManifestAndMetadataXML | void,
    NavigationXML | void,
  ]): string {
    log.info('opf build [package]')

    const { metadata, manifest } =
      manifestAndMetadataXML as ManifestAndMetadataXML
    const { guide, spine } = navigationXML as NavigationXML

    const opfString =
      renderLayouts(
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
