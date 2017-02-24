
import { pick, pickBy, identity, keys } from 'lodash'
import { serialize } from '../async'
import actions from '../state'

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
    .config({
      bber: {
        build: _buildArgs(yargs.argv)
      }
    })

const handler = (argv) => {
  const buildCmds = _buildCommands
  const buildArgs = _buildArgs(argv)
  const buildTasks = buildArgs.length ? buildArgs : !buildArgs.length && argv.d ? [] : buildCmds
  const sequence = ['clean', 'create', 'copy', 'sass', 'scripts', 'render', 'loi', 'inject', 'opf']

  const { bber } = argv
  actions.setBber({ bber })

  const run = (tasks) => {
    const next = tasks.shift()
    actions.setBber({ build: next })
    serialize([...sequence, next]).then(() => {
      if (tasks.length) { run(tasks) }
    })
  }

  run(buildTasks)
}

export default {
  command,
  describe,
  builder,
  handler
}
