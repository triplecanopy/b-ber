/**
 * Generates metadata, manifest, guide, and spine XML and writes to to
 * `content.opf`. Calls {@link module:manifestAndMetadata} and {@link module:navigation#Navigation}
 * @module opf
 * @see {@link module:opf#Opf}
 * @return {Opf}
 */


import path from 'path'
import fs from 'fs-extra'
import renderLayouts from 'layouts'
import File from 'vinyl'
import state from '@canopycanopycanopy/b-ber-lib/State'
import log from '@canopycanopycanopy/b-ber-logger'
import Pkg from '@canopycanopycanopy/b-ber-templates/Opf/Pkg'
import {ManifestAndMetadata, Navigation} from './'

/**
 * @alias module:opf#Opf
 */
class Opf {
    get dist() { // eslint-disable-line class-methods-use-this
        return state.dist
    }

    constructor() {
        this.createOpfPackageString = Opf.prototype.constructor.createOpfPackageString.bind(this)
        this.writeOpfToDisk = Opf.prototype.constructor.writeOpfToDisk.bind(this)
        this.init = this.init.bind(this)
    }

    /**
     * Create the root `package` element and inject metadata, manifest, and
     * navigation data
     * @param  {Object} manifestAndMetadataXML Manifest and metadata XML
     * @param  {Object} navigationXML          Navigation XML
     * @return {Promise<Object>}
     */
    static createOpfPackageString([manifestAndMetadataXML, navigationXML]) {
        log.info('opf creating [opf]')
        return new Promise(resolve => {
            const {metadata, manifest} = manifestAndMetadataXML
            const {spine, guide} = navigationXML.strings

            const opfString = renderLayouts(
                new File({
                    path: '.tmp',
                    layout: 'body',
                    contents: new Buffer(`
                        ${metadata}
                        ${manifest}
                        ${spine}
                        ${guide}
                    `),
                }),
                {body: Pkg.body()}
            ).contents.toString()

            resolve(opfString)
        })
    }

    /**
     * Write the `content.opf` to the output directory
     * @param  {String} contents The `content.opf` string
     * @return {Promise<Object>}
     */
    static writeOpfToDisk(contents) {
        return new Promise(resolve => {
            const opsPath = path.join(this.dist, 'OPS', 'content.opf')
            fs.writeFile(opsPath, contents, err => {
                if (err) throw err
                log.info(`Wrote content.opf [${opsPath}]`)
                resolve(contents)
            })
        })
    }

    /**
     * Initialize `content.opf` creation
     * @return {Promise<Object>}
     */
    init() {
        return new Promise(resolve => {
            const manifestAndMetadata = new ManifestAndMetadata()
            const navigation = new Navigation()

            Promise.all([
                manifestAndMetadata.init(),
                navigation.init(),
            ])
                .then(resp => this.createOpfPackageString(resp))
                .then(resp => this.writeOpfToDisk(resp))
                .catch(err => log.error(err))
                .then(resolve)
        })
    }
}

export default Opf
