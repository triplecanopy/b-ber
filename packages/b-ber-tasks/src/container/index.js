/**
 * @module create
 */

/* eslint-disable class-methods-use-this */


import path from 'path'
import fs from 'fs-extra'
import log from '@canopycanopycanopy/b-ber-logger'
import Xml from '@canopycanopycanopy/b-ber-templates/Xml'
import state from '@canopycanopycanopy/b-ber-lib/State'

const cwd = process.cwd()

class Container {
    get src() {
        return state.src
    }
    get dist() {
        return state.dist
    }
    get dirs() {
        return [
            path.join(this.dist, 'OPS'),
            path.join(this.dist, 'META-INF'),
        ]
    }

    /**
     * @constructor
     */
    constructor() {
        this.testParams = Container.prototype.constructor.testParams.bind(this)
        this.init = this.init.bind(this)
    }

    write() {
        return new Promise(resolve => {
            const files = [
                {path: path.join('META-INF', 'container.xml'), content: Xml.container()},
                {path: 'mimetype', content: Xml.mimetype()},
            ]
            return files.forEach((_, i) =>
                fs.writeFile(path.join(this.dist, _.path), _.content, err => {
                    if (err) throw err
                    log.info('Wrote [%s]', _.path)
                    if (i === files.length - 1) {
                        resolve()
                    }
                })
            )
        })
    }

    makedirs() {
        return new Promise(resolve =>
            this.dirs.map((dir, index) =>
                fs.mkdirs(dir, err => {
                    if (err) throw err
                    log.info('Created directory [%s]', dir)
                    if (index === this.dirs.length - 1) {
                        resolve()
                    }
                })
            )
        )
    }

    static testParams(_input, _output, callback) {
        if (!_input || !_output) {
            throw new Error('[Create#testParams] requires both [input] and [output] parameters')
        }

        const input = path.resolve(cwd, _input)
        const output = path.resolve(cwd, _output)

        try {
            if (!fs.existsSync(input)) {
                throw new Error(`
                    Cannot resolve input path: [${input}].
                    Run [bber init] to start a new project`
                )
            }
        } catch (err) {
            log.error(err)
            process.exit(0)
        }

        return fs.mkdirs(output, err => {
            if (err) throw err
            return callback()
        })
    }

    init() {
        return new Promise(resolve =>
            this.testParams(this.src, this.dist, () =>
                this.makedirs()
                .then(() => this.write())
                .catch(err => log.error(err))
                .then(resolve)
            )
        )
    }
}

const container = new Container()
export default container.init
