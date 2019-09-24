import path from 'path'
import state from '@canopycanopycanopy/b-ber-lib/State'
import { create } from 'browser-sync'
import * as tasks from '../'

const browserSync = create()
const port = 4000
const prepare = [
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

const make = build => {
    state.update('build', build)
    state.update('config.base_url', '/')
    state.update('config.remote_url', `http://localhost:${port}`)
    state.update('config.reader_url', `http://localhost:${port}`)

    return tasks.async.serialize([...prepare, build], tasks)
}

const watch = build => {
    browserSync.init({
        watch: true,
        port,
        server: path.resolve(`project-${build}`),
        plugins: [
            {
                module: 'bs-html-injector',
                options: {
                    files: [
                        {
                            match: [
                                path.resolve('_project', '**', '*.scss'),
                                path.resolve('_project', '**', '*.js'),
                                path.resolve('_project', '**', '*.md'),
                            ],
                            fn: (/* event, file */) => make(build),
                        },
                    ],
                },
            },
        ],
    })
}

const serve = ({ build }) => make(build).then(() => watch(build))

export default serve
