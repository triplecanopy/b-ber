import path from 'path'
import nodemon from 'nodemon'
import log from 'b-ber-logger'
import { serialize } from 'bber-lib/async'
import { src, dist } from 'bber-utils'
import store from 'bber-lib/store'

const PORT = 8080
const DEBOUNCE_SPEED = 400
const SEQUENCE = ['clean', 'container', 'sass', 'copy', 'scripts', 'render', 'loi', 'footnotes', 'inject', 'opf', 'web']

let timer
let files = []

const restart = () =>
    new Promise(resolve => {
        store.update('build', 'web') // set the proper build vars
        store.update('toc', store.builds.web.tocEntries)
        store.update('spine', store.builds.web.spineEntries)

        return serialize(SEQUENCE).then(resolve)
    })

const serve = () =>
    new Promise(resolve => {
        restart().then(() => {
            console.log()
            log.info('Starting nodemon')
            nodemon({
                script: path.join(__dirname, 'server.js'),
                ext: 'md js scss es es6',
                env: { NODE_ENV: 'development' },
                ignore: ['node_modules', 'lib'],
                watch: [
                    src(),
                    path.resolve(__dirname, '..', '..', '..'),
                ],
                args: [
                    '--use_socket_server',
                    '--use_hot_reloader',
                    `--port ${PORT}`,
                    `--dir ${dist()}`,
                ],
            })
            .once('start', resolve)
            .on('restart', (file) => {
                clearTimeout(timer)
                files.push(file)
                timer = setTimeout(() => {
                    log.info(`Restarting server due to changes:\n${files.join('\n')}`)
                    console.log()
                    restart().then(() => { files = [] })
                }, DEBOUNCE_SPEED)
            })
        })

        process.once('SIGTERM', () => {
            process.exit(0)
        })
        process.once('SIGINT', () => {
            process.exit(0)
        })

    })

export default serve
