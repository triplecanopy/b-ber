// Generates metadata, manifest, guide, and spine XML and writes to to `content.opf`

import fs from 'fs-extra'
import renderLayouts from 'layouts'
import File from 'vinyl'
import state from '@canopycanopycanopy/b-ber-lib/State'
import log from '@canopycanopycanopy/b-ber-logger'
import Pkg from '@canopycanopycanopy/b-ber-templates/Opf/Pkg'
import { ManifestAndMetadata, Navigation } from '.'

class Opf {
    static createOpf() {
        return new Promise(resolve => {
            const manifestAndMetadata = new ManifestAndMetadata()
            const navigation = new Navigation()

            Promise.all([manifestAndMetadata.init(), navigation.init()])
                .then(Opf.createOpfPackageString)
                .then(Opf.writeOpfToDisk)
                .catch(log.error)
                .then(resolve)
        })
    }

    // Create the root `package` element and inject metadata, manifest, and navigation data
    static createOpfPackageString([manifestAndMetadataXML, navigationXML]) {
        log.info('opf build [package]')
        return new Promise(resolve => {
            const { metadata, manifest } = manifestAndMetadataXML
            const { spine, guide } = navigationXML.strings

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
                { body: Pkg.body() },
            ).contents.toString()

            resolve(opfString)
        })
    }

    // Write the `content.opf` to the output directory
    static writeOpfToDisk(contents) {
        return new Promise(resolve => {
            const opsPath = state.dist.ops('content.opf')
            fs.writeFile(opsPath, contents, err => {
                if (err) throw err
                log.info(`opf emit content.opf [${opsPath}]`)
                resolve(contents)
            })
        })
    }
}

export default Opf
