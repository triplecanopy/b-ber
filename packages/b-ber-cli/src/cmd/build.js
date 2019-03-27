import path from 'path'
import * as tasks from '@canopycanopycanopy/b-ber-tasks'
import state from '@canopycanopycanopy/b-ber-lib/State'
import sequences from '@canopycanopycanopy/b-ber-shapes/sequences'
import createBuildSequence from '@canopycanopycanopy/b-ber-shapes/create-build-sequence'
import Project from '@canopycanopycanopy/b-ber-templates/Project'
import { ensure } from '@canopycanopycanopy/b-ber-lib/utils'

// note leading pipe - to ensure we can run the `all` command without arguments
const command = 'build [|epub|mobi|pdf|reader|sample|web]'
const describe = 'Build a project'

const handler = argv => {
    process.env.NODE_ENV = process.env.NODE_ENV || 'development'
    const sequence = createBuildSequence(argv)

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

    const { src } = state
    const projectPath = path.join(process.cwd(), src)

    const files = [...Project.javascripts(projectPath), ...Project.stylesheets(projectPath)]

    // phantomjs takes forever (> 5sec) to exit, but we need to wait for it to
    // finish to ensure that state is updated with the default cover image if
    // none exists. phantomjs can be sped up by disabling wifi connection, see
    // bug report here: https://github.com/ariya/phantomjs/issues/14033
    ensure({ files })
        .then(() => run(sequence))
        .catch(console.error)
}

const builder = yargs =>
    yargs
        .command('', 'Build all formats', () => {}, handler)
        .command('epub', 'Build an Epub', () => {}, handler)
        .command('mobi', 'Build a Mobi', () => {}, handler)
        .command('pdf', 'Build a PDF', () => {}, handler)
        .command('reader', 'Build for the b-ber-reader format', () => {}, handler)
        .command('sample', 'Build a sample Epub', () => {}, handler)
        .command('web', 'Build for web', () => {}, handler)
        // .command('xml', 'Build for XML', () => {}, handler)
        .help('h')
        .alias('h', 'help')

export default {
    command,
    describe,
    builder,
    handler,
}
