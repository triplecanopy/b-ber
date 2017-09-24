/* eslint-disable class-methods-use-this */
import Promise from 'zousan'
import fs from 'fs-extra'
import path from 'path'
import nodemon from 'nodemon'
// import opn from 'opn'
import log from 'b-ber-logger'

class Server {
    set dir(d) {
        this._dir = d
    }

    get dir() {
        return this._dir
    }

    /**
     * [constructor description]
     * @param  {Object} options [description]
     * @return {Object}
     */
    constructor(options = {}) {
        this.serve = this.serve.bind(this)
        this.validateBuildPath = this.validateBuildPath.bind(this)

        const defaults = { port: 3000, dir: './_site' }
        const settings = Object.assign({}, defaults, options)
        const { port, dir } = settings

        this.port = port
        this.validateBuildPath(dir)
    }

    /**
     * [validateBuildPath description]
     * @param  {String} _dir [description]
     * @return {Object}
     */
    validateBuildPath(_dir) {
        const dir = path.resolve(process.cwd(), _dir)
        try {
            if (!fs.existsSync(dir)) {
                throw new TypeError(`Cannot resolve path [${dir}]`)
            }
        } catch (err) {
            log.error(err)
        }

        this.dir = dir
        log.info(`Setting endpoint to [${this.dir}]`)
        return this
    }

    serve() { // eslint-disable-line class-method-use-this
        return new Promise((resolve) => {
            process.once('SIGTERM', () => {
                process.exit(0)
            })
            process.once('SIGINT', () => {
                process.exit(0)
            })
            return nodemon({
                script: path.join(__dirname, 'server.js'),
                env: { NODE_ENV: 'development' },
                args: [
                    `--dir ${this.dir}`,
                    `--port ${this.port}`,
                ],
            }).once('start', () => {
                log.info('Starting nodemon')
                // opn(`http://localhost:${this.port}`)
                resolve()
            })
        })
    }
}

const server = Server
export default server
