
import { init as Init } from 'bber-output'

const command = ['init [options...]', 'i']
const describe = 'Initalize b-ber'
const builder = yargs =>
  yargs
    .options({
      s: {
        alias: 'src',
        default: '_book',
        describe: 'Define the book\'s src path',
        type: 'string',
      },
      d: {
        alias: 'dist',
        default: 'book',
        describe: 'Define the book\'s dist path',
        type: 'string',
      },
    })

    .help('h')
    .alias('h', 'help')
    .usage('\nUsage: $0 init')

const handler = (argv) => {
  const task = new Init(argv)
  return task.init()
}

export default {
  command,
  describe,
  builder,
  handler,
}
