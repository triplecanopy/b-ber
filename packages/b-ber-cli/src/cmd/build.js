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
    process.env.NODE_ENV = process.env.NODE_ENV || 'development'
    const sequence = createBuildSequence(argv)

    // make sure all necessary directories exist.
    // TODO: should be a separate task
    const ensure = () =>
        new Promise(resolve => {
            const cwd = process.cwd()
            const { src } = state
            const projectPath = path.join(cwd, src)
            return Promise.all([
                fs.mkdirp(path.join(projectPath, '_fonts')),
                fs.mkdirp(path.join(projectPath, '_images')),
                fs.mkdirp(path.join(projectPath, '_javascripts')),
                fs.mkdirp(path.join(projectPath, '_markdown')),
                fs.mkdirp(path.join(projectPath, '_media')),
                fs.mkdirp(path.join(projectPath, '_stylesheets')),
            ])
                .then(() => {
                    const files = [
                        ...Project.javascripts(projectPath),
                        ...Project.stylesheets(projectPath),
                    ]

                    const requiredFiles = files.reduce((acc, curr) => {
                        try {
                            fs.statSync(curr.absolutePath)
                        } catch (err) {
                            acc.concat(
                                fs.writeFile(curr.absolutePath, curr.content),
                            )
                        }

                        return acc
                    }, [])

                    return requiredFiles.length
                        ? Promise.all(requiredFiles).then(resolve)
                        : resolve()
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
    ensure().then(() => run(sequence))
}

const builder = yargs =>
    yargs
        .command('', 'Build all formats', () => {}, handler)
        .command('epub', 'Build an Epub', () => {}, handler)
        .command('mobi', 'Build a Mobi', () => {}, handler)
        .command('pdf', 'Build a PDF', () => {}, handler)
        .command(
            'reader',
            'Build for the b-ber-reader format',
            () => {},
            handler,
        )
        .command('sample', 'Build a sample Epub', () => {}, handler)
        .command('web', 'Build for web', () => {}, handler)
        .help('h')
        .alias('h', 'help')

export default {
    command,
    describe,
    builder,
    handler,
}
