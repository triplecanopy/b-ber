import path from 'path'
import * as tasks from '@canopycanopycanopy/b-ber-tasks'
import state from '@canopycanopycanopy/b-ber-lib/State'
import createBuildSequence from '@canopycanopycanopy/b-ber-shapes-sequences/create-build-sequence'
import sequences from '@canopycanopycanopy/b-ber-shapes-sequences/sequences'
import Project from '@canopycanopycanopy/b-ber-templates/Project'
import { ensure } from '@canopycanopycanopy/b-ber-lib/utils'
import log from '@canopycanopycanopy/b-ber-logger'

// note leading pipe - to ensure we can run the `all` command without arguments
const command = 'build [|epub|mobi|pdf|reader|sample|web]'
const describe = 'Build a project'

const handler = argv => {
    process.env.NODE_ENV = process.env.NODE_ENV || 'development'

    const sequence = createBuildSequence(argv)
    const subSequence = sequence.reduce((a, c) => a.concat(...sequences[c]), [])

    state.update('sequence', subSequence)
    log.registerSequence(state, command, subSequence)

    const run = buildTasks => {
        const build = buildTasks.shift()

        state.reset()
        state.update('build', build)

        return tasks.async.serialize(sequences[build], tasks).then(() => {
            if (buildTasks.length) run(buildTasks)
        })
    }

    const projectPath = path.resolve(state.srcDir)
    const files = [...Project.javascripts(projectPath), ...Project.stylesheets(projectPath)]

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
        .command('xml', 'Build for XML', () => {}, handler)
        .help('h')
        .alias('h', 'help')

export default {
    command,
    describe,
    builder,
    handler,
}
