import path from 'path'
import nodemon from 'nodemon'
import log from '@canopycanopycanopy/b-ber-logger'
import state from '@canopycanopycanopy/b-ber-lib/State'
import * as tasks from '../'

const PORT = 4000
const DEBOUNCE_SPEED = 400
const SEQUENCE = [
    'clean',
    'cover',
    'container',
    'sass',
    'copy',
    'scripts',
    'render',
    'loi',
    'footnotes',
    'inject',
    'opf',
]

let timer
let files = []

const createSequence = build => [...SEQUENCE, build]

const restart = build =>
    new Promise(resolve => {
        state.update('build', build)
        state.update('toc', state.buildTypes[build].tocEntries)
        state.update('spine', state.buildTypes[build].spineEntries)
        state.update('config.base_url', '/')
        state.update('config.remote_url', `http://localhost:${PORT}`)
        state.update('config.reader_url', `http://localhost:${PORT}`)

        return tasks.async.serialize(createSequence(build), tasks).then(resolve)
    })

const registerObserver = build =>
    new Promise(resolve =>
        nodemon({
            script: path.join(__dirname, `server-${build}.js`),
            ext: 'md js scss',
            env: {
                NODE_ENV: JSON.stringify('development'),
            },
            ignore: ['node_modules', 'dist'],
            watch: [state.src],
            args: ['--use_socket_server', '--use_hot_reloader', `--port ${PORT}`, `--dir ${state.dist}`],
        })
            .once('start', resolve)
            .on('restart', file => {
                clearTimeout(timer)
                files.push(file)
                timer = setTimeout(() => {
                    log.info('Restarting server due to changes')
                    log.info(`${files.join('\n')}`)

                    files = []
                    restart(build)
                }, DEBOUNCE_SPEED)
            }),
    )

const serve = ({ build }) => {
    restart(build).then(() => registerObserver(build))

    process.once('SIGTERM', () => process.exit(0))
    process.once('SIGINT', () => process.exit(0))
}

export default serve
