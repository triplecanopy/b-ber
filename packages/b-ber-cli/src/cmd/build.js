import fs from 'fs-extra'
import path from 'path'
import * as tasks from '@canopycanopycanopy/b-ber-tasks'
import state from '@canopycanopycanopy/b-ber-lib/State'
import sequences from '@canopycanopycanopy/b-ber-shapes/sequences'
import createBuildSequence from '@canopycanopycanopy/b-ber-shapes/create-build-sequence'
import Project from '@canopycanopycanopy/b-ber-templates/Project'

const command = ['build [options...]', 'b']
const describe = 'Compile a project'
const builder = yargs =>
    yargs
        .options({
            d: {
                alias: 'dir',
                describe: 'Compile the output dir',
                default: false,
                type: 'boolean',
            },
            e: {
                alias: 'epub',
                describe: 'Build an ePub',
                default: false,
                type: 'boolean',
            },
            m: {
                alias: 'mobi',
                describe: 'Build a mobi',
                default: false,
                type: 'boolean',
            },
            w: {
                alias: 'web',
                describe: 'Build for web',
                default: false,
                type: 'boolean',
            },
            p: {
                alias: 'pdf',
                describe: 'Create a PDF',
                default: false,
                type: 'boolean',
            },
            s: {
                alias: 'sample',
                describe: 'Create a sample ePub',
                default: false,
                type: 'boolean',
            },
            r: {
                alias: 'reader',
                describe: 'Build for the b-ber-reader format',
                default: false,
                type: 'boolean',
            },
            a: {
                alias: 'all',
                describe: 'Build all formats',
                default: true,
                type: 'boolean',
            },
        })

        .help('h')
        .alias('h', 'help')

const handler = argv => {

    process.env.NODE_ENV = process.env.NODE_ENV || 'production'

    const sequence = createBuildSequence(argv)

    // make sure all necessary directories exist.
    // TODO: should be a separate task
    const ensure = _ => new Promise(resolve => {
        const cwd = process.cwd()
        const src = state.src
        return Promise.all([
            fs.mkdirp(path.join(cwd, src, '_fonts')),
            fs.mkdirp(path.join(cwd, src, '_images')),
            fs.mkdirp(path.join(cwd, src, '_javascripts')),
            fs.mkdirp(path.join(cwd, src, '_markdown')),
            fs.mkdirp(path.join(cwd, src, '_media')),
            fs.mkdirp(path.join(cwd, src, '_stylesheets')),
        ])
            .then(_ => {
                const projectPath = path.join(cwd, state.src)
                const files = [
                    ...Project.javascripts(projectPath),
                    ...Project.stylesheets(projectPath),
                ]

                const requiredFiles = []

                files.forEach(a => {
                    try {
                        fs.statSync(path.join(cwd, a.relativePath))
                    } catch (err) {
                        requiredFiles.push(fs.writeFile(a.relativePath, a.content))
                    }
                })

                if (requiredFiles.length) {
                    Promise.all(requiredFiles).then(resolve)
                } else {
                    resolve()
                }
            })


            .then(resolve)
    })


    const run = buildTasks => {
        const build = buildTasks.shift()

        state.reset()
        state.update('build', build)
        state.update('toc', state.buildTypes[build].tocEntries)
        state.update('spine', state.buildTypes[build].spineEntries)
        state.merge('config', state.buildTypes[build].config)

        return tasks.async.serialize(sequences[build], tasks).then(() => {
            if (buildTasks.length) run(buildTasks)
        })
    }

    // phantomjs takes forever (> 5sec) to exit, but we need to wait for it to
    // finish to ensure that state is updated with the default cover image if
    // none exists. phantomjs can be sped up by disabling wifi connection, see
    // bug report here: https://github.com/ariya/phantomjs/issues/14033
    ensure().then(_ => run(sequence))
}

export default {
    command,
    describe,
    builder,
    handler,
}
