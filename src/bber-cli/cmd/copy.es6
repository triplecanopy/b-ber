
import { copy } from 'bber-output'
import { log } from 'bber-plugins'
import { fail } from 'bber-cli/helpers'

const command = ['copy', '[options...]', 'c']
const describe = 'Copy assets to the output dir'
const builder = yargs =>
  yargs
    .options({
      i: {
        alias: 'in',
        describe: 'The directory/directories to copy',
        default: [],
        type: 'array'
      },
      o: {
        alias: 'out',
        describe: 'The directory to copy',
        default: '',
        type: 'string'
      }
    })
    .fail((msg, err) => fail(msg, err, yargs))
    .help('h')
    .alias('h', 'help')
    .usage('\nUsage: $0 copy')

const handler = copy

// const handler = (argv) => {
//   const i = argv.i
//   const o = argv.o
//   if (!i.length || !o) { throw new Error('Both input and output directories must be provided') }
//   return copy(i, o).then(() => log.info(`Copied ${i} to ${o}`))
// }


export default {
  command,
  describe,
  builder,
  handler
}
