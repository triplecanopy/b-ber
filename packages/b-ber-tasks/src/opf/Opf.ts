// Generates metadata, manifest, guide, and spine XML and writes to to `content.opf`

import type { BuildContext } from '@canopycanopycanopy/b-ber-lib'
import log from '@canopycanopycanopy/b-ber-logger'
import Pkg from '@canopycanopycanopy/b-ber-templates/Opf/Pkg'
import fs from 'fs-extra'
import renderLayouts from 'layouts' // eslint-disable-line import/no-unresolved
import File from 'vinyl' // eslint-disable-line import/no-unresolved
import { dist } from '../context'
import ManifestAndMetadata from './ManifestAndMetadata'
import Navigation, { type NavigationInputs } from './Navigation'

// What `content.opf` and the navigation documents are made from: what render,
// loi and footnotes returned, and the spine they extended
export interface OpfInputs extends NavigationInputs {
  remoteAssets: string[]
}

// What the `init`s below resolve to. Each ends in a catch that reports the
// error and rethrows it, so a failure rejects rather than resolving to
// anything. Spelled out
// rather than derived from the `init`s: their types come through the
// `layouts` stub, which tsdown's declaration build does not see, so derived
// types are `any` in dist/index.d.ts. `createOpf` passes the `init`s' results
// here, which checks the two agree
interface ManifestAndMetadataXML {
  metadata: string
  manifest: string
}
interface NavigationXML {
  spine: string
  guide: string
}

class Opf {
  static createOpf(
    ctx: BuildContext,
    { remoteAssets, ...navigation }: OpfInputs
  ) {
    const manifestAndMetadata = new ManifestAndMetadata(ctx, { remoteAssets })

    return Promise.all([
      manifestAndMetadata.init(),
      Navigation.init(ctx, navigation),
    ])
      .then(Opf.createOpfPackageString)
      .then((contents) => Opf.writeOPF(ctx, contents))
      .catch((err) => {
        throw log.error(err)
      })
  }

  static writeOPF(ctx: BuildContext, contents: string) {
    const opsPath = dist(ctx).ops('content.opf')
    log.info(`opf emit content.opf [${opsPath}]`)

    return fs.writeFile(opsPath, contents)
  }

  // Create the root `package` element and inject metadata, manifest, and navigation data
  static createOpfPackageString([manifestAndMetadataXML, navigationXML]: [
    ManifestAndMetadataXML,
    NavigationXML,
  ]): string {
    log.info('opf build [package]')

    const { metadata, manifest } = manifestAndMetadataXML
    const { guide, spine } = navigationXML

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
