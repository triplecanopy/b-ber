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
        const manifestAndMetadata = new ManifestAndMetadata()
        const navigation = new Navigation()

        return Promise.all([manifestAndMetadata.init(), navigation.init()])
            .then(Opf.createOpfPackageString)
            .then(Opf.writeOpfToDisk)
            .catch(log.error)
    }

    // Create the root `package` element and inject metadata, manifest, and navigation data
    static createOpfPackageString([manifestAndMetadataXML, navigationXML]) {
        log.info('opf build [package]')

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

        return opfString
    }

    // Write the `content.opf` to the output directory
    static writeOpfToDisk(contents) {
        const opsPath = state.dist.ops('content.opf')
        log.info(`opf emit content.opf [${opsPath}]`)
        fs.writeFile(opsPath, contents).then(() => contents)
    }
}

export default Opf
