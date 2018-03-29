import path from 'path'
import nodemon from 'nodemon'
import log from '@canopycanopycanopy/b-ber-logger'
import state from '@canopycanopycanopy/b-ber-lib/State'
import {serialize} from '../async'
import * as tasks from '../'

const PORT = 8080
const DEBOUNCE_SPEED = 400
const SEQUENCE = ['clean', 'container', 'sass', 'copy', 'scripts', 'render', 'loi', 'footnotes', 'inject', 'opf', 'web']

let timer
let files = []

const restart = _ =>
    new Promise(resolve => {
        state.update('build', 'web') // set the proper build vars
        state.update('toc', state.buildTypes.web.tocEntries)
        state.update('spine', state.buildTypes.web.spineEntries)
        state.update('config.baseurl', '/')

        return serialize(SEQUENCE, tasks).then(resolve)
    })


const serve = _ =>
    new Promise(resolve => {
        restart()
        .then(_ =>
            nodemon({
                script: path.join(__dirname, 'server.js'),
                ext: 'md js scss',
                env: {NODE_ENV: 'development'},
                ignore: ['node_modules', 'lib'],
                watch: [
                    state.src,
                    path.resolve(__dirname, '..', '..', '..'),
                ],
                args: [
                    '--use_socket_server',
                    '--use_hot_reloader',
                    `--port ${PORT}`,
                    `--dir ${state.dist}`,
                ],
            })
            .once('start', resolve)
            .on('restart', file => {
                clearTimeout(timer)
                files.push(file)
                timer = setTimeout(_ => {
                    log.info(`Restarting server due to changes:\n${files.join('\n')}`)
                    console.log()
                    restart().then(_ => files = [])
                }, DEBOUNCE_SPEED)
            })
        )

        process.once('SIGTERM', _ => {
            process.exit(0)
        })
        process.once('SIGINT', _ => {
            process.exit(0)
        })

    })

export default serve
