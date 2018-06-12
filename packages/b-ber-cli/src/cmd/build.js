import fs from 'fs-extra'
import path from 'path'
import * as tasks from '@canopycanopycanopy/b-ber-tasks'
import state from '@canopycanopycanopy/b-ber-lib/State'
import sequences from '@canopycanopycanopy/b-ber-shapes/sequences'
import createBuildSequence from '@canopycanopycanopy/b-ber-shapes/create-build-sequence'
import Project from '@canopycanopycanopy/b-ber-templates/Project'

const command = 'build [|epub|mobi|pdf|reader|sample|web]' // note leading pipe - to ensure we can run the `all` command without arguments
const describe = 'Build a project'

const handler = argv => {

    // console.log(argv)

    process.env.NODE_ENV = process.env.NODE_ENV || 'production'
    const sequence = createBuildSequence(argv)

    // console.log(sequence)

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

const builder = yargs =>
    yargs
        .command(
            '',
            'Build all formats',
            () => {},
            handler,
        )
        .command(
            'epub',
            'Build an Epub',
            () => {},
            handler,
        )
        .command(
            'mobi',
            'Build a Mobi',
            () => {},
            handler,
        )
        .command(
            'pdf',
            'Build a PDF',
            () => {},
            handler,
        )
        .command(
            'reader',
            'Build for the b-ber-reader format',
            () => {},
            handler,
        )
        .command(
            'sample',
            'Build a sample Epub',
            () => {},
            handler,
        )
        .command(
            'web',
            'Build for web',
            () => {},
            handler,
        )
        .help('h')
        .alias('h', 'help')

export default {
    command,
    describe,
    builder,
    handler,
}
