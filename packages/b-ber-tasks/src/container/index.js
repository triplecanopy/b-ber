/* eslint-disable class-methods-use-this */
import path from 'path'
import fs from 'fs-extra'
import log from '@canopycanopycanopy/b-ber-logger'
import Xml from '@canopycanopycanopy/b-ber-templates/Xml'
import state from '@canopycanopycanopy/b-ber-lib/State'

class Container {
    get dirs() {
        return [state.dist.ops(), state.dist.root('META-INF')]
    }

    constructor() {
        this.init = this.init.bind(this)
    }

    write() {
        const files = [
            {
                path: path.join('META-INF', 'container.xml'),
                content: Xml.container(),
            },
            { path: 'mimetype', content: Xml.mimetype() },
        ]

        const promises = files.map(file =>
            fs
                .writeFile(state.dist.root(file.path), file.content)
                .then(() => log.info('container emit [%s]', file.path))
        )

        return Promise.all(promises)
    }

    makedirs() {
        const promises = this.dirs.map(dir => fs.mkdirs(dir).then(() => log.info('container emit [%s]', dir)))
        return Promise.all(promises)
    }

    init() {
        return this.makedirs()
            .then(() => this.write())
            .catch(log.error)
    }
}

const container = new Container()
export default container.init
