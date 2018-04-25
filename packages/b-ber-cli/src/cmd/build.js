import * as allTasks from '@canopycanopycanopy/b-ber-tasks'
import state from '@canopycanopycanopy/b-ber-lib/State'
import sequences from '@canopycanopycanopy/b-ber-shapes/sequences'
import createBuildSequence from '@canopycanopycanopy/b-ber-shapes/create-build-sequence'

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

    const run = buildTasks => {
        const build = buildTasks.shift()

        state.reset()
        state.update('build', build)
        state.update('toc', state.buildTypes[build].tocEntries)
        state.update('spine', state.buildTypes[build].spineEntries)
        state.merge('config', state.buildTypes[build].config)

        return allTasks.async.serialize(sequences[build], allTasks).then(() => {
            if (buildTasks.length) run(buildTasks)
        })
    }

    // phantomjs takes forever (> 5sec) to exit, but we need to wait for it to
    // finish to ensure that state is updated with the default cover image if
    // none exists. phantomjs can be sped up by disabling wifi connection, see
    // bug report here: https://github.com/ariya/phantomjs/issues/14033
    run(sequence)
}

export default {
    command,
    describe,
    builder,
    handler,
}
