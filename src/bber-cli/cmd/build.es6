import { pick, pickBy, identity, keys } from 'lodash'
import { serialize } from 'bber-lib/async'
import store from 'bber-lib/store'
import cover from 'bber-output/cover'

const _buildCommands = ['epub', 'mobi', 'pdf', 'web', 'sample']
const _buildArgs = args => keys(pickBy(pick(args, _buildCommands), identity))

const command = ['build [options...]', 'b']
const describe = 'Compile a book'
const builder = yargs =>
  yargs
    .options({
      d: {
        alias: 'dir',
        describe: 'Compile the output dir',
        default: false,
        type: 'boolean'
      },
      e: {
        alias: 'epub',
        describe: 'Build an ePub',
        default: false,
        type: 'boolean'
      },
      m: {
        alias: 'mobi',
        describe: 'Build a mobi',
        default: false,
        type: 'boolean'
      },
      w: {
        alias: 'web',
        describe: 'Build for web',
        default: false,
        type: 'boolean'
      },
      p: {
        alias: 'pdf',
        describe: 'Create a PDF',
        default: false,
        type: 'boolean'
      },
      s: {
        alias: 'sample',
        describe: 'Create a sample ePub',
        default: false,
        type: 'boolean'
      },
      a: {
        alias: 'all',
        describe: 'Build all formats',
        default: true,
        type: 'boolean'
      }
    })

    .help('h')
    .alias('h', 'help')

const handler = (argv) => {
  const buildCmds = _buildCommands
  const buildArgs = _buildArgs(argv)
  const buildTasks = buildArgs.length ? buildArgs : !buildArgs.length && argv.d ? [] : buildCmds
  const sequence = ['clean', 'create', 'copy', 'sass', 'scripts', 'render', 'loi', 'inject', 'opf']

  const run = (tasks) => {
    const next = [tasks.shift()]
    store.update('build', next[0])
    if (next[0] === 'mobi') { next.unshift('mobiCSS') } // TODO: this should be called by `mobi` task
    return serialize([...sequence, ...next]).then(() => {
      if (tasks.length) { run(tasks) }
    })
  }

  // phantomjs takes forever (> 5sec) to exit, but we need to wait for it to
  // finish to ensure that store is updated with the default cover image if
  // none exists. phantomjs can be sped up by disabling wifi connection, see
  // bug report here: https://github.com/ariya/phantomjs/issues/14033
  return cover.create().then(() => run(buildTasks))
}

export default {
  command,
  describe,
  builder,
  handler
}
