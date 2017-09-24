import { pick, pickBy, identity, keys } from 'lodash'
import { serialize } from 'bber-lib/async'
import store from 'bber-lib/store'


import log from 'b-ber-logger'

const _buildCommands = ['epub', 'mobi', 'pdf', 'web', 'sample']
const _buildArgs = args => keys(pickBy(pick(args, _buildCommands), identity))

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
            a: {
                alias: 'all',
                describe: 'Build all formats',
                default: true,
                type: 'boolean',
            },
        })

        .help('h')
        .alias('h', 'help')

const handler = (argv) => {
    const buildCmds = _buildCommands
    const buildArgs = _buildArgs(argv)
    const buildTasks = buildArgs.length ? buildArgs : !buildArgs.length && argv.d ? [] : buildCmds

    // TODO: sequence = store.sequences

    const sequence = ['clean', 'container', 'cover', 'sass', 'copy', 'scripts', 'render', 'loi', 'footnotes', 'inject', 'opf'] // eslint-disable-line max-len



    const run = (tasks) => {
        const next = [tasks.shift()]

        store.reload()
        store.update('build', next[0])
        store.update('toc', store.builds[next[0]].tocEntries)
        store.update('spine', store.builds[next[0]].spineEntries)

        if (next[0] === 'mobi') { next.unshift('mobiCSS') } // TODO: this should be called by `mobi` task
        return serialize([...sequence, ...next]).then(() => {
            if (tasks.length) { run(tasks) }
        })
    }

    // phantomjs takes forever (> 5sec) to exit, but we need to wait for it to
    // finish to ensure that store is updated with the default cover image if
    // none exists. phantomjs can be sped up by disabling wifi connection, see
    // bug report here: https://github.com/ariya/phantomjs/issues/14033
    run(buildTasks)
}

export default {
    command,
    describe,
    builder,
    handler,
}
